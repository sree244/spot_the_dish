const express = require('express');
const app = express();
const session = require("express-session");
app.use(express.json());
app.use(express.urlencoded({extended: false}));
const port = 4000;
const mongoose = require("mongoose");
const path = require('path'); 
const axios = require('axios');
const appId = '3254fa0a';
const appKey = 'baf3d8f60b550b0627dd4231f118de16';
const apiID = '3dfef851';
const apiKey = '7ed2713d91712450f0c194409ee5728c';
app.set('view engine', 'ejs'); 


app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  

const mail = require('./public/js/mail');
const config = require('./public/js/config');
app.use(session({secret:config.sessionSecret}));


const connect = mongoose.connect("mongodb://localhost:27017/Spot_the_dish");
connect.then(()=>{
    console.log("Database connected successfully.");
})
.catch(()=>{
    console.log("Database cannot be connected.");
});

const searchSchema = new mongoose.Schema({
    searchitem: { type: String },
    searchTimestamp: { type: Date, default: Date.now }
});
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true},
    username: { type: String, required: true },
    gender: { type: String, enum: ['M', 'F', 'Other'], default: 'F' }, 
    dietChoice: { type: String, enum: ['veg', 'non-veg'], default: 'veg'},
    searchHistory1: [searchSchema],
    searchHistory2: [searchSchema],
    is_verified: { type: Number, default: 0 },
    profilePicUrl: { type: String, default: "images/p1.jpeg" } 
});



// Create User model
const Users = mongoose.model('Users', userSchema);


// Routes
app.get('', (req, res) => {
    if(!req.session.user_id){
        let message = req.query.message || null;
        res.render('login', {message: message});
    }
    else{
        res.redirect('/home')
    }
})

app.post('', async (req, res) =>{
    try{
        const check = await Users.findOne({email: req.body.Usermail});
        if(!check){
            return res.redirect("/?message=Invalid login credentials.");
        }
        if (check.is_verified === 0){
            return res.redirect("/?message=User not verified.");
        }
        if (req.body.password !== check.password) {
            return res.redirect("/?message=Invalid login credentials.");
        }
        else{
            req.session.user_id = check._id;
            res.redirect("/home");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("In login post Internal server error");
    
} })

app.get('/home', async (req, res) => {
    try {
        if (req.session.user_id) {
            const user = await Users.findById(req.session.user_id);
            res.render('home', { username: user.username });
        } else {
            res.redirect('/');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});
   
app.get('/contact', (req, res) => {
        if(req.session.user_id){ 
            res.sendFile(__dirname + '/views/contact.html');
        }
        else{
            res.redirect('/');
        }
    })

app.get('/profile', async (req, res) => {
    try {
        if (req.session.user_id) {
            const user = await Users.findById(req.session.user_id);
            if (user) {
                res.render('profile', { user: user }); // Pass the user object to the profile template
            } else {
                res.redirect('/');
            }
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/edit', (req, res)=>{
    if(req.session.user_id){ 
        res.sendFile(__dirname + '/views/editdetails.html');
    }
    else{
        res.redirect('/');
    }
})

app.post('/edit', async (req, res) => {
    try {
        const userId = req.session.user_id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { username, gender, dietChoice } = req.body;

        // Construct the update object dynamically based on the submitted fields
        const updateFields = {};
        if (username) updateFields.username = username;
        if (gender) updateFields.gender = gender;
        if (dietChoice) updateFields.dietChoice = dietChoice;

        // Update user's details in the database
        await Users.findByIdAndUpdate(userId, updateFields);

        res.redirect('/profile'); // Redirect to the profile page after updating
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/changeprofile', (req, res)=>{
    if(req.session.user_id){ 
        res.sendFile(__dirname + '/views/changeprofile.html');
    }
    else{
        res.redirect('/');
    }
})

app.post('/updateprofilepic', async (req, res) => {
    try {
        const userId = req.session.user_id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const { profilePicUrl } = req.body;

        
        await Users.findByIdAndUpdate(userId, { profilePicUrl });
        
    
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/signup', (req, res) => {
    if(!req.session.user_id){
        let message = req.query.message || null;
        res.render("Signup", {message: message, error:false});
    }
    else{
        res.redirect('/home')
    }
})

app.post('/signup', async (req, res)=>{
    const data = {
        username: req.body.Username,
        email: req.body.Usermail,
        password: req.body.password1
    }
    try{
        const existingUser = await Users.findOne({email: data.email});
        if(existingUser){
            res.redirect("/signup?message=This email was already taken.&error=true");
        }
        else{
            const userdata = await Users.insertMany(data);
            mail.sendVerifyMail(req.body.Username, req.body.Usermail, userdata[0]._id);
            res.redirect("/signup?message=Registration Successful!. Please verify your email.&error=false");
    }
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
        }
});


app.get('/forgot', (req, res) => {
    if(!req.session.user_id){
        let message = req.query.message || null;
        res.render("forgot", {message: message, error: false});
    }
    else{
        res.redirect('/home')
    }
})

app.post('/forgot', async (req, res)=>{
    try{
        const existingUser = await Users.findOne({email: req.body.Useremail});
        if(existingUser){
            if(existingUser.is_verified===1){
                const randomPassword = mail.generateRandomPassword(8);
                const updateInfo = await Users.updateOne({ email: req.body.Useremail }, { $set: { password: randomPassword } });
                mail.sendresetMail(req.body.Useremail, randomPassword);
                res.redirect("/forgot?message=Please check your email for reset password and login.&error=false");
            }
            else{
                res.redirect("forgot?message=User email is not verified.&error=true")
            }
        }
        else{
            res.redirect("/forgot?message=User not registered.&error:true");
    }
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
        }
        
});
app.get('/change-password', (req, res) => {
    if(req.session.user_id){
        res.render("change", {message: "If password gets updated then you need to login again."})
    }
    else{
        res.redirect('/')
    }
})

app.post('/change-password', async (req, res) =>{
    try{
        const existingUser = await Users.findOne({_id: req.session.user_id});
        if(existingUser){
            const updateInfo = await Users.updateOne({ email: existingUser.email }, { $set: { password: req.body.password1 } });
            res.redirect('/logout')
            }
        else{
            res.render("change", {message: "Password not updated."})
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
        }
        
})
app.get('/recipes', (req, res) => {
    if(req.session.user_id){
        res.render('recipes', { searchResults: null, searchQuery:'', 
    dietLabel: 'none', prepTime: 'none', cuisineType: 'none', dishType: 'none' });
    }
    else{
        res.redirect('/');
    }
})



app.get('/verify', async (req, res) => {
    try {
        const userId = req.query.id; 
        const existingUser = await Users.findOne({_id: userId});
        if(existingUser && existingUser.is_verified !== 1){
            const updateInfo = await Users.updateOne({ _id: userId }, { $set: { is_verified: 1 } });
            res.render("email-verified");
        }
        else if(!existingUser) {
            res.send("User doesn't register Or you might be clicking on the old verification link.")
        }
        else{
            res.redirect('/verified');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal server error");
    }
});

app.get('/logout', (req, res) => {
    try{
        req.session.destroy();
        res.redirect('/');
    }catch(error){
        console.log(error.message);
    }
});

app.get('/verification', (req, res) => {
    if(!req.session.user_id){
        let message = req.query.message || null;
        res.render("verification", {message: message});
    }
    else{
        res.redirect('/home')
    }
});

app.get('/verified', async (req, res) => {
    try {
        res.render("verified");
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal server error");
    }
});
app.post('/verification', async (req, res) => {
    try{
        const existingUser = await Users.findOne({email: req.body.Useremail});
        if(existingUser){
            if(existingUser.is_verified === 1){
                res.redirect('/verified')
            }
            else{
                mail.sendVerifyMail(existingUser.username, req.body.Useremail, existingUser._id);
                res.redirect("/verification?message=Verification link sent to your email.");
            }
        }
        else{
            res.redirect("/verification?message=Email not registered.");
        }
       
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
        }
})


app.post('/recipes', (req, res) => {
    const query = req.body.searcher || '';
    const dietLabel = req.body.dietLabel || 'none'; // Diet label filter
    const cuisineType = req.body.cuisineType || 'none'; // Cuisine type filter
    const dishType = req.body.dishType || 'none'; // Dish type filter
    const prepTime = req.body.prepTime || 'none'; 
    let apiUrl = `https://api.edamam.com/api/recipes/v2?type=public&q=${query}&app_id=${appId}&app_key=${appKey}`;
    if (dietLabel !== 'none') {
        apiUrl += `&diet=${dietLabel}`;
    }
    if (cuisineType !== 'none') {
        apiUrl += `&cuisineType=${cuisineType}`;
    }
    if (dishType !== 'none') {
        apiUrl += `&dishType=${dishType}`;
    }
    if (prepTime !== 'none') {
        apiUrl += `&time=${prepTime}`;
    }
    
    axios.get(apiUrl)
        .then(response => {
            if (response.data.hits.length > 0) {
                const recipeKeys = Object.keys(response.data.hits[0].recipe);
                console.log('All keys in the recipe object:', recipeKeys);
            }
            var searchResults = response.data.hits.map(hit => {
                const recipe = hit.recipe;
               
                return {
                    url: recipe.url,
                    label: recipe.label,
                    image: recipe.image,
                    yield: recipe.yield,
                    totalTime: recipe.totalTime,
                    cuisineType: recipe.cuisineType,
                    dishType: recipe.dishType,
                    source: recipe.source
                };
            });
            
            const userId = req.session.user_id; 
            const searchQuery = query.trim();
            if (searchQuery && userId) {
                const searchHistoryItem = {
                    searchitem: searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1),
                    searchTimestamp: new Date()
                };
                
                // Push the search history item to the appropriate search history array
                Users.findById(userId)
                    .then(user => {
                        if (user.searchHistory2.length >= 20) {
                            user.searchHistory2.shift(); // Remove the oldest element
                        }
                        user.searchHistory2.push(searchHistoryItem); 
                        return user.save()
                    })
                    .catch(error => {
                        console.error('Error updating search history:', error);
                    });
            }
            if (searchResults.length > 12) {
                var searchResults = searchResults.slice(0, 12);
            }
            // Send search results to the frontend
            res.render('recipes', { searchResults: searchResults, searchQuery: query,
            dietLabel: dietLabel,
            cuisineType: cuisineType,
            dishType: dishType,
            prepTime: prepTime});
        })
        .catch(error => {
            console.error('Error:', error);
            res.status(500).send("Error");
        });
});


// Route to fetch and display search history
app.get('/search-history', (req, res) => {
    const userId = req.session.user_id; // Assuming user ID is stored in the session
    if (!userId) {
        return res.redirect('/'); // Redirect to login if user is not authenticated
    }

    // Fetch user document with search history
    Users.findById(userId)
        .then(user => {
            if (!user) {
                return res.status(404).send('User not found');
            }

            // Pass search history to the view for rendering
            res.render('history', { searchHistory: user.searchHistory2 });
        })
        .catch(error => {
            console.error('Error fetching user:', error);
            res.status(500).send('Internal server error');
        });
});


app.get('/history', (req, res) => {
    const userId = req.session.user_id; // Assuming user ID is stored in the session
    if (!userId) {
        return res.redirect('/'); // Redirect to login if user is not authenticated
    }

    // Fetch user document with search history
    Users.findById(userId)
        .then(user => {
            if (!user) {
                return res.status(404).send('User not found');
            }

            // Pass search history to the view for rendering
            res.render('history1', { searchHistory: user.searchHistory1 });
        })
        .catch(error => {
            console.error('Error fetching user:', error);
            res.status(500).send('Internal server error');
        });
});


app.get('/byingredient',(req,res)=>{
    if(req.session.user_id){
        res.render('byingredient');
    }
    else{
        res.redirect('/');
    }
})

app.get('/results',(req,res)=>{
    if(req.session.user_id){
        res.render('ingredientsresults',{searchResults:null});
    }
    else{
        res.redirect('/');
    }
})

app.get('/ytb',(req,res)=>{
    if(req.session.user_id){
        res.render('ytapi');
    }
    else{
        res.redirect('/');
    }
})

app.post('/byingredient', (req, res) => {
    let ingredients=[];
    let checkboxes=req.body.checkbox;
    if(typeof checkboxes=='string'){
        ingredients.push(checkboxes);
    }
    if(Array.isArray(checkboxes)){
        for(let i=0;i<checkboxes.length;i++){
            ingredients.push(checkboxes[i]);
        }
    }
    let ingre=req.body.ing || '';
    if(ingre!==''){
        let search_arr=ingre.split(',');
        for(let j=0;j<search_arr.length;j++){
            ingredients.push(search_arr[j]);
        }
    }
    
    const inglist=ingredients.join(',');
    
    const query = ingredients  ;
    const cuisineType=req.body.cuisineType || 'none';
    const mealType=req.body.mealType || 'none';

    let apiUrl = `https://api.edamam.com/api/recipes/v2?type=public&q=${query}&app_id=${apiID}&app_key=${apiKey}`;
    if(cuisineType!=='none'){
        apiUrl+=`&cuisineType=${cuisineType}`;
    }
    if(mealType!=='none'){
        apiUrl+=`&mealType=${mealType}`;
    }
   
    axios.get(apiUrl)
        .then(response => {
         
            var searchResults = response.data.hits.map(hit => {
                const recipe = hit.recipe;
                return {
                    id: recipe.url,
                    label: recipe.label,
                    image: recipe.image,
                    yield: recipe.yield,
                    totalTime: recipe.totalTime,
                    cuisineType: recipe.cuisineType,
                    dishType: recipe.dishType
                };
            });
            
            const userId = req.session.user_id; // Assuming user ID is stored in the session
           
            
            if (inglist && userId) {
                const searchHistoryItem = {
                    searchitem: inglist,
                    searchTimestamp: new Date()
                };
                
                // Push the search history item to the appropriate search history array
                Users.findById(userId)
                    .then(user => {
                        if (user.searchHistory1.length >= 20) {
                            user.searchHistory1.shift(); // Remove the oldest element
                        }
                        user.searchHistory1.push(searchHistoryItem); 
                        
                        return user.save()
                    })
                    .catch(error => {
                        console.error('Error updating search history:', error);
                    });
            }
            if (searchResults.length > 12) {
                var searchResults = searchResults.slice(0, 12);
            }
            
            // Send search results to the frontend
            res.render('ingredientsresults', { searchResults: searchResults });
        

        })
        .catch(error => {
            console.error('Error:', error);
            res.status(500).send("Error");
        });
});


app.listen(port, ()=> console.log(`Listening ${port}`));

app.get('/recipe', (req, res) => {
    res.render("recipe-details", {recipeDetails:null});
}
)
app.post('/recipe', (req, res) => {
    const query = req.body.searcher || '';
    const limit = 12; // Number of recipes needed
    axios.get(`https://api.edamam.com/search?q=${query}&app_id=${appId}&app_key=${appKey}&to=${limit}`)
        .then(response => {
            // Log entire response data
            console.log(response.data);

            // Log all keys in the recipe object for the first hit
            if (response.data.hits.length > 0) {
                const recipeKeys = Object.keys(response.data.hits[0].recipe);
                console.log('All keys in the recipe object:', recipeKeys);
            }

            // Extract specific fields for each recipe and create a new array with these fields
            const recipesData = response.data.hits.map(hit => {
                const recipe = hit.recipe;
                return {
                    label: recipe.label,
                    url: recipe.url,
                    image: recipe.image,
                    shareAs: recipe.shareAs,
                    yield: recipe.yield,
                    dietLabels: recipe.dietLabels,
                    healthLabels: recipe.healthLabels,
                    ingredientLines: recipe.ingredientLines,
                    ingredients: recipe.ingredients,
                    calories: recipe.calories,
                    totalTime: recipe.totalTime,
                    cuisineType: recipe.cuisineType,
                    mealType: recipe.mealType,
                    dishType: recipe.dishType
                };
            });

            // Log specific fields of each recipe
            recipesData.forEach(recipe => {
                console.log('Recipe Label:', recipe.label);
                console.log('Recipe URL:', recipe.url);
                // console.log('Recipe Image URL:', recipe.image);
                console.log('Share As:', recipe.shareAs);
                console.log('Yield:', recipe.yield);
                console.log('Diet Labels:', recipe.dietLabels);
                console.log('Health Labels:', recipe.healthLabels);
                console.log('Ingredients:', recipe.ingredientLines);
                console.log("Cuisine Type:", recipe.cuisineType)
                console.log('Meal Type', recipe.mealType);
                console.log('Dish type', recipe.dishType);
                console.log('----------------------------------');
                
            });
            if (response.data.hits.length > 0) {
                const recipeKeys = Object.keys(response.data.hits[0].recipe);
                console.log('All keys in the recipe object:', recipeKeys);
            }
            // Send the extracted recipe data to the client
            res.json(recipesData);
        })
        .catch(error => {
            console.error('Error:', error);
            res.status(500).send('Error fetching data');
        });
});




app.get('/recipe-details', (req, res) => {
    const recipeUrl = req.query.url; // Assuming the recipe URL is passed as a query parameter
    const recipeLabel = req.query.label; // Assuming the recipe label is passed as a query parameter

    // Fetch top 3 videos related to the recipe from YouTube API
    axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
            part: 'snippet',
            q: "how to make " + recipeLabel, // Use recipe label as the search query
            maxResults: 15, // Limit to 3 videos
            key: 'AIzaSyCYfUMHJMcoUdaKwCCk3jsngVrpVO_Xnyk' // Replace with your actual YouTube API key
        }
    })
    .then(response => {
        const videoUrls = response.data.items.map(item => `https://www.youtube.com/embed/${item.id.videoId}`);
        console.log(recipeUrl);
        const userId = req.session.user_id; // Assuming you have user authentication and session management
        if (userId) {
            const searchHistoryItem = {
                searchitem: recipeLabel, // Save the recipe name
                searchTimestamp: new Date()
            };
            
            // Push the search history item to the user's search history array
            Users.findById(userId)
                .then(user => {
                    if (user.searchHistory2.length >= 20) {
                        user.searchHistory2.shift(); // Remove the oldest element if the array is full
                    }
                    user.searchHistory2.push(searchHistoryItem); 
                    return user.save();
                })
                .catch(error => {
                    console.error('Error updating search history:', error);
                });
        }
        // Render the recipe details template with the recipe URL and videos
        res.render('recipe-details', { recipeUrl:recipeUrl, videoUrls:videoUrls, recipelabel:recipeLabel });
    })
    .catch(error => {
        console.error('Error fetching videos:', error);
        res.status(500).send("Error");
    });
});
