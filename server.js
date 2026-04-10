require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.disable("x-powered-by");

app.use(express.json());
app.use(express.static("public"));

app.post("/send", async (req, res) => {
  try {
    const { name, phone, type, message, price, captcha } = req.body;

    // проверка капчи
    const verify = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: "POST",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body: `secret=${process.env.SECRET_KEY}&response=${captcha}`
    });

    const data = await verify.json();

    if (!data.success) {
      return res.status(400).send({ error: "Captcha error" });
    }

    const text = `
🚀 AsiaTechnoStroy — новая заявка

👤 Имя: ${name}
📞 Телефон: ${phone}
🏢 Тип: ${type}
📝 Комментарий: ${message}
💰 Оценка: ${price} сум
`;

    await fetch(`https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        chat_id: process.env.CHAT_ID,
        text
      })
    });

    res.send({ success: true });

  } catch (e) {
    res.status(500).send({ error: "Ошибка сервера" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Server error");
});
