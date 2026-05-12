require("dotenv").config();

const express = require("express");
const axios = require("axios");
const path = require("path");
const cors = require("cors");
const puppeteer = require("puppeteer");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/send", async (req, res) => {
  try {
    const { name, object, phone, area, type, systems, total } = req.body;

    // TELEGRAM (не валим сервер если ошибка)
    try {
      await axios.post(`https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`, {
        chat_id: process.env.CHAT_ID,
        text: `Заявка\n${name}\n${object}\n${phone}\n${area}\n${systems}\n${total}`
      });
    } catch (e) {
      console.log("Telegram error:", e.message);
    }

    // HTML
    let html = fs.readFileSync(
      path.join(__dirname, "template.html"),
      "utf8"
    );

    const now = new Date();
    const number = Math.floor(Math.random() * 900 + 100);
    const date = now.toLocaleDateString("ru-RU");

    const formatNumber = (num) =>
      num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    // фикс total
    const cleanTotal = parseInt(total.toString().replace(/\s/g, ""));
    if (!cleanTotal || isNaN(cleanTotal)) {
      throw new Error("TOTAL INVALID");
    }

    html = html
      .replace("{{name}}", name)
      .replace("{{phone}}", phone)
      .replace("{{object}}", object)
      .replace("{{area}}", area)
      .replace("{{systems}}", systems.replace(/\n/g, "<br>"))
      .replace("{{rate}}", Math.round(cleanTotal / area))
      .replace("{{total}}", formatNumber(cleanTotal))
      .replace("{{number}}", number)
      .replace("{{date}}", date)
      .replace("{{cover}}", "http://localhost:3000/assets/cover.jpg")
      .replace("{{logo}}", "http://localhost:3000/assets/logo.png")
      .replace("{{stamp}}", "http://localhost:3000/assets/stamp.png");
fs.writeFileSync("debug.html", html);
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"]
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0"
    });

    // ждём загрузку картинок
    await page.evaluate(async () => {
      const imgs = Array.from(document.images);
      await Promise.all(
        imgs.map((img) => {
          if (img.complete) return;
          return new Promise((res) => {
            img.onload = img.onerror = res;
          });
        })
      );
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    // ВАЖНО: отдаем как бинарник
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=KP.pdf");
    res.setHeader("Content-Length", pdf.length);

    res.end(pdf);

  } catch (err) {
    console.error(err);
    res.status(500).send("SERVER ERROR: " + err.message);
  }
});

app.listen(3000, () => {
  console.log("http://localhost:3000");
});
