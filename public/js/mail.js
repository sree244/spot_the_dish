const nodemailer = require('nodemailer');
const sendVerifyMail = async(name, email, user_id) =>{
    try{
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth:{
                user: 'emaildemomy414@gmail.com',
                pass: 'tbbzkewgvcvkxoeu'
            }
        });
        const mailOptions = {
            from: 'emaildemomy414@gmail.com',
            to: email,
            subject: 'Email Verification',
            html: '<p> Hi '+name+', Please click here to <a href="http://127.0.0.1:4000/verify?id='+user_id+'"> Verify your mail. </a> </p>'
        
        }
        const send = await transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log('Email send falied', error);
            
            }
            else{
                console.log('Email sent successfully.');
            }
    });
    }
    catch(error){
        console.log(error.message);
    };
};

const sendresetMail = async(email, randomPassword) =>{
    
    try{
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth:{
                user: 'emaildemomy414@gmail.com',
                pass: 'tbbzkewgvcvkxoeu'
            }
        });
        const mailOptions = {
            from: 'emaildemomy414@gmail.com',
            to: email,
            subject: 'Spot the dish: Reset Password',
            html: '<p>On your request, your password has been reset to "'+randomPassword+'".Kindly relogin <a href=http://127.0.0.1:4000> here </a>. You can change your password by clicking on change password after logging on into our website.</p>'
        }
        const send = await transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log('Email send falied', error);
            
            }
            else{
                console.log('Email sent successfully.');
            }
    });
    }
    catch(error){
        console.log(error.message);
    };
    
};

const generateRandomPassword = (length) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password
}

module.exports = {
  sendVerifyMail, sendresetMail, generateRandomPassword
};