const sgMail = require("@sendgrid/mail");
const { SENGRID_API_KEY } = process.env;

sgMail.setApiKey(SENGRID_API_KEY);

const sendEmail = async (data) => {
  const mail = { ...data, from: "Vbzvar@gmail.com" };
  await sgMail.send(mail);
  return true;
};

module.exports = sendEmail;
