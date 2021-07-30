import { Telegraf } from "telegraf";
import session from "@telegraf/session";
import axios from "axios";
import express from "express";
const expressApp = express();
const API_TOKEN =
  process.env.API_TOKEN || "1936078013:AAGrLH4rQv6mxOSJWHAZjxFjFI_6mDd3vAM";
const PORT = process.env.PORT || 3000;
const URL = process.env.URL || "https://introbot-in.herokuapp.com/";
const bot = new Telegraf(API_TOKEN);
bot.use(session());
//method for invoking start command
bot.telegram.setWebhook(`${URL}/introbot/`);
expressApp.use(bot.webhookCallback(`/introbot/`));
/*  
    @/start command 
    to launch bot
 */
bot.command("start", async (ctx, next) => {
  const welcomeMessage = `Welcome ${ctx.chat.first_name}! Please choose your language. \n \nSelamat datang ${ctx.chat.first_name}! Silakan pilih bahasa Anda.`;
  bot.telegram.sendMessage(ctx.chat.id, welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Bahasa",
            callback_data: "bahasa",
          },
          {
            text: "English",
            callback_data: "english",
          },
        ],
      ],
    },
  });
});

/* 
    @bot on callback button
*/
bot.action("english", async (ctx, next) => {
  //send message
  const messages = [
    `Hi ${ctx.chat.first_name}! I'm Introbot - the AI community manager. \n \n I can help with specific COVID related requirements`,
    `We're a small team of passionate citizens. Follow us at twitter.com/introbotAI & twitter.com/COVIDcitizens.`,
    `So, what are you looking for? And where?`,
    `*Please answer in the format of <resource> in <city>. E.g. Hospital beds in Jakarta, Oxygen Cylinders in Bekasi, etc.* Don't forget to put in between the resource and city you're looking for`,
    `At any time, if you use the word *COVID*, I'll jump back to this question.`,
  ];
  for (const msg of messages) {
    await ctx.reply(msg);
  }
  ctx.session.error = `Sorry ${ctx.chat.first_name} I couldn't get that. Please use the word COVID or type <resource> in <city> format.`; //print error for any other message
  ctx.session.language = "english"; //current language
});

/* 
    @bahasa
*/

bot.action("bahasa", async (ctx, next) => {
  //send message
  const messages = [
    `Hai ${ctx.chat.first_name}! Saya Introbot - manajer komunitas AI. \n \n Saya dapat membantu dengan persyaratan khusus terkait COVID`,
    `Kami adalah tim kecil yang terdiri dari warga yang bersemangat. Ikuti kami di twitter.com/introbotAI & twitter.com/COVIDcitizens.`,
    `Jadi apa yang Anda cari? Dan dimana?`,
    `Jawablah dalam format <resource> di <city>. Misalnya. Tempat tidur rumah sakit di Jakarta, Tabung Oksigen di Jakarta, dll.`,
    `Kapan saja, jika Anda menggunakan kata covid, saya akan melompat kembali ke pertanyaan ini.`,
  ];
  for (const msg of messages) {
    await ctx.reply(msg);
  }
  ctx.session.error = `Maaf ${ctx.chat.first_name} Saya tidak bisa mendapatkannya. Silakan gunakan kata COVID atau ketik <resource> dalam/di format <city>.`;
  ctx.session.language = "bahasa";
});

bot.hears(/Covid|covid|COVID/, async (ctx, next) => {
  const welcomeMessage = `Welcome ${ctx.chat.first_name}! Please choose your language. \n \nSelamat datang ${ctx.chat.first_name}! Silakan pilih bahasa Anda.`;
  bot.telegram.sendMessage(ctx.chat.id, welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Bahasa",
            callback_data: "bahasa",
          },
          {
            text: "English",
            callback_data: "english",
          },
        ],
      ],
    },
  });
});

/* 
    @end - the above will return for the word COVID too -- i hope -- fingers crossed :P
*/

/* 
    @fetch request
    async await to fetch request for the query
*/
let globalSupplierID = 0;
let globalVerifierID = 0;
let feedback = "";
// var supp = 0; var supplier = 0;
var fetchResources = async (ctx, url, requestType) => {
  try {
    let resp = await axios.get(url);
    globalSupplierID = resp.data.data[0].uuid;
    globalVerifierID = `"${ctx.chat.id}"`;
    //assign data to variables
    let sname = resp.data.data[0].name;
    let phone = resp.data.data[0].phone;
    let verification = resp.data.data[0].lastverified;
    let lang = ctx.session.language;
    let supplier_location =
      resp.data.data[0].location + ", " + resp.data.data[0].state;
    let mSuppID = resp.data.data[0].uuid;
    let fullname = ctx.chat.first_name + "  " + ctx.chat.last_name;
    let data = JSON.stringify({
      fields: {
        Log: `"Supplier ID: ${mSuppID}, \t Supplier Name: ${sname}, \t Supplier Phone: ${phone}, \t Supplier Location: ${supplier_location}"`,
        Query: ctx.session.query,
        "Verifier ID": `"Telegram Username: ${ctx.chat.username}, Full Name: ${fullname}, UserID: ${ctx.chat.id}"`,
        Type: requestType,
      },
    });
    console.log(data);
    let config = {
      method: "post",
      url: "https://api.airtable.com/v0/appHbvQKMtjBWjKKU/COVID%20Log",
      headers: {
        Authorization: "Bearer keyUO2phAn88sMvvW",
        "Content-Type": "application/json",
      },
      data: data,
    };
    axios(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
      })
      .catch((error) => {
        console.log(error);
      });
    /* 
            @Send the result to the user
        */
    if (lang === `english`) {
      await ctx.reply(
        `Please contact ${sname}. \n \n☎️ ${phone} (Last verified: ${verification}). \n \nPlease let me know if they're helpful, out of stock, unresponsive or invalid. \n \nOnce you response I'll share another contact.`
      );
      const btnMsg = `Choose one:`;
      await bot.telegram.sendMessage(ctx.chat.id, btnMsg, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "👍 Helpful",
                callback_data: "helpful",
              },
              {
                text: "❌ Out of Stock",
                callback_data: "out_of_stock",
              },
            ],
            [
              {
                text: "☹️ Unresponsive",
                callback_data: "unresponsive",
              },
              {
                text: "❌ Invalid",
                callback_data: "invalid",
              },
            ],
          ],
        },
      });
    } else if (lang === `bahasa`) {
      ctx.reply(
        `Harap hubungi ${sname}. \n ️\n☎️ ${phone} (Terakhir diverifikasi: ${verification}). \n \nBeri tahu saya jika berguna, stok habis , tidak responsif atau tidak valid. \n \nSetelah Anda merespons, saya akan membagikan kontak lain.`
      );
      const btnMsg = `Pilih satu:`;
      bot.telegram.sendMessage(ctx.chat.id, btnMsg, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "👍 Bermanfaat",
                callback_data: "helpful",
              },
              {
                text: "❌ Kehabisan persediaan",
                callback_data: "out_of_stock",
              },
            ],
            [
              {
                text: "☹️ Tidak responsif",
                callback_data: "unresponsive",
              },
              {
                text: "❌ Tidak sah",
                callback_data: "invalid",
              },
            ],
          ],
        },
      });
    } else if (lang === undefined) {
      if (["in", "In", "IN"].indexOf(value) >= 0) {
        await ctx.reply(
          `Please contact ${sname}. \n \n☎️ ${phone} (Last verified: ${verification}). \n \nPlease let me know if they're helpful, out of stock, unresponsive or invalid. \n \nOnce you response I'll share another contact.`
        );
        const btnMsg = `Choose one:`;
        await bot.telegram.sendMessage(ctx.chat.id, btnMsg, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "👍 Helpful",
                  callback_data: "helpful",
                },
                {
                  text: "❌ Out of Stock",
                  callback_data: "out_of_stock",
                },
              ],
              [
                {
                  text: "☹️ Unresponsive",
                  callback_data: "unresponsive",
                },
                {
                  text: "❌ Invalid",
                  callback_data: "invalid",
                },
              ],
            ],
          },
        });
      } else if (
        ["di", "Di", "DI", "dalam", "Dalam", "DALAM"].indexOf(value) >= 0
      ) {
        await ctx.reply(
          `Harap hubungi ${sname}. \n ️\n☎️ ${phone} (Terakhir diverifikasi: ${verification}). \n \nBeri tahu saya jika berguna, stok habis , tidak responsif atau tidak valid. \n \nSetelah Anda merespons, saya akan membagikan kontak lain.`
        );
        const btnMsg = `Pilih satu:`;
        await bot.telegram.sendMessage(ctx.chat.id, btnMsg, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "👍 Bermanfaat",
                  callback_data: "helpful",
                },
                {
                  text: "❌ Kehabisan persediaan",
                  callback_data: "out_of_stock",
                },
              ],
              [
                {
                  text: "☹️ Tidak responsif",
                  callback_data: "unresponsive",
                },
                {
                  text: "❌ Tidak sah",
                  callback_data: "invalid",
                },
              ],
            ],
          },
        });
      }
    }
  } catch (err) {
    const welcomeMessage = `Welcome ${ctx.chat.first_name}! To search for a resource, please choose your language. \n \nSelamat datang ${ctx.chat.first_name}! Silakan pilih bahasa Anda.`;
    bot.telegram.sendMessage(ctx.chat.id, welcomeMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Bahasa",
              callback_data: "bahasa",
            },
            {
              text: "English",
              callback_data: "english",
            },
          ],
        ],
      },
    });
  }
};
const postFeedback = async (
  ctx,
  supplierID,
  verifierID,
  url,
  feedback,
  requestType
) => {
  let data = {
    feedback: feedback,
    query: ctx.session.query,
    source: "telegram",
    supply: supplierID,
    verifierID: verifierID,
  };
  let config = {
    method: "post",
    url: url,
    headers: {
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJiMDk0NzY1Ny05MDliLTRmOWEtYWFjNi0wODc5ZTI4YjU0M2MiLCJ0ZWFtTmFtZSI6IkludHJvYm90IiwiaWF0IjoxNjIwOTgwNzI2fQ.FWl39s9ok0oxeMPK3v7qNVg--oDmUcVouRAuvQ2FEk4",
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios(config)
    .then(async (response) => {
      //set variables
      let message = ctx.session.query;
      let m = message.toLowerCase();
      let userID = `"${ctx.chat.id}"`;
      let fields = m.split(/in|di|dalam|Dalam|DALAM|IN|DI/);
      let service = fields[0];
      let city = fields[1];
      const s = service.replace(/\s/g, "");
      const c = city.replace(/\s/g, "");
      //fetch results for query
      if (fields) {
        await fetchResources(
          ctx,
          `https://api.covidcitizens.org/api/v2/leadbyqueryintrobot?location=${c}&category=${s}&verifierID=${userID}`,
          `Telegram | Unhelpful/POST COVID Verification`
        );
        let supplier_location =
          resp.data.data[0].address + ", " + resp.data.data[0].pin_code;
        let mSuppID = resp.data.data[0].uuid;
        let fullname = ctx.chat.first_name + "  " + ctx.chat.last_name;
        let data = JSON.stringify({
          fields: {
            Log: `"Supplier ID: ${mSuppID}, \t Supplier Name: ${sname}, \t Supplier Phone: ${phone}, \t Supplier Location: ${supplier_location}"`,
            Query: ctx.session.query,
            "Verifier ID": `"Telegram Username: ${ctx.chat.username}, Full Name: ${fullname}, UserID: ${ctx.chat.id}"`,
            Type: requestType,
          },
        });
        console.log(data);
        let config = {
          method: "post",
          url: "https://api.airtable.com/v0/appHbvQKMtjBWjKKU/COVID%20Log",
          headers: {
            Authorization: "Bearer keyUO2phAn88sMvvW",
            "Content-Type": "application/json",
          },
          data: data,
        };
        axios(config)
          .then((response) => {
            console.log(JSON.stringify(response.data));
          })
          .catch((error) => {
            console.log(error);
          });
      }
    })
    .catch((error) => {
      console.log(error);
    });
};

/*
    @BOT hears the requirement
    make GET request to the API
*/
bot.hears(
  /[^a-zA-Z](in|di|IN|DI|dalam|Dalam|DALAM)[^a-zA-Z]/,
  async (ctx, next) => {
    //get service request and province
    let message = ctx.message.text;
    let m = message.toLowerCase();
    let userID = `"${ctx.chat.id}"`;
    let fields = m.split(/in|di|IN|DI|dalam|Dalam|DALAM/);
    let service = fields[0];
    let city = fields[1];
    const s = service.replace(/\s/g, "");
    const c = city.replace(/\s/g, "");
    /* store city, service and userid in session */
    ctx.session.city = c;
    ctx.session.service = s;
    ctx.session.uid = userID;
    ctx.session.query = m;
    var str = m;
    var value = str.match(/(in|di|IN|DI|dalam|Dalam|DALAM)/i)[1];
    if (fields) {
      //fetch results for query
      fetchResources(
        ctx,
        `https://api.covidcitizens.org/api/v2/leadbyqueryintrobot?location=${c}&category=${s}&verifierID=${userID}`,
        `Telegram | GET COVID Supply v2`
      );
    }
  }
);

/* 
    @bot hears callback for buttons
*/
bot.action("helpful", async (ctx, next) => {
  postFeedback(
    ctx,
    globalSupplierID,
    globalVerifierID,
    `https://api.covidcitizens.org/api/v1/addfeedback`,
    `helpful`
  );
});

bot.action("invalid", async (ctx, next) => {
  postFeedback(
    ctx,
    globalSupplierID,
    globalVerifierID,
    `https://api.covidcitizens.org/api/v1/addfeedback`,
    `invalid`
  );
});
bot.action("out_of_stock", async (ctx, next) => {
  postFeedback(
    ctx,
    globalSupplierID,
    globalVerifierID,
    `https://api.covidcitizens.org/api/v1/addfeedback`,
    `out of stock`
  );
});
bot.action("unresponsive", async (ctx, next) => {
  postFeedback(
    ctx,
    globalSupplierID,
    globalVerifierID,
    `https://api.covidcitizens.org/api/v1/addfeedback`,
    `unresponsive`
  );
});
/* 
    @error
    if user types anything BAKWAS instead of the allowed format show error
*/

bot.on("text", (ctx) => {
  const botError = ctx.session.error;
  if (botError === undefined) {
    const welcomeMessage = `To Search the resources in your city. Please choose your language. \n \nUntuk mencari sumber daya di kota Anda. Silakan pilih bahasa Anda.`;
    bot.telegram.sendMessage(ctx.chat.id, welcomeMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Bahasa",
              callback_data: "bahasa",
            },
            {
              text: "English",
              callback_data: "english",
            },
          ],
        ],
      },
    });
  } else {
    ctx.reply(`${ctx.session.error}`);
  }
});

//bot ends
expressApp.get("/", (req, res) => {
  res.send("Hello World!");
});
expressApp.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
