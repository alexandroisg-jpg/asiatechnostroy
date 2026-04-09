function calculate() {
  let area = document.getElementById("area").value;
  let type = document.getElementById("calcType").value;

  let price = 0;

  if(type === "office") price = area * 15000;
  if(type === "mall") price = area * 25000;
  if(type === "industrial") price = area * 20000;

  document.getElementById("result").innerText = "≈ " + price + " сум / мес";
  return price;
}

document.getElementById("form").addEventListener("submit", function(e){
  e.preventDefault();

  let name = document.getElementById("name").value.trim();
  let phone = document.getElementById("phone").value.trim();
  let type = document.getElementById("type").value;
  let message = document.getElementById("message").value.trim();
  let captcha = grecaptcha.getResponse();

  if(!name || !phone || !type){
    alert("Заполните все поля");
    return;
  }

  if(!captcha){
    alert("Подтвердите, что вы не робот");
    return;
  }

  fetch("/send", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      name,
      phone,
      type,
      message,
      price: calculate(),
      captcha
    })
  }).then(()=> {
    alert("Заявка отправлена");
    document.getElementById("form").reset();
    grecaptcha.reset();
  });
});