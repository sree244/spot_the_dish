const ingredients=JSON.parse(localStorage.getItem('ingredients'));
console.log(ingredients);  

const cuisineType=localStorage.getItem('cuisineType');
const mealType=localStorage.getItem('mealType');

function getvideo(ele){
  let pr=ele.querySelector("h3");
  let con=pr.textContent;
  localStorage.setItem('title',con);
  window.open('/ytb','_blank');
}
function getBack(){
  window.location.href='/byingredient';
}
