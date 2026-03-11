import nodemailer from "nodemailer";
import twilio from "twilio";

const formatStatus = (status) => status?.replaceAll("_", " ") || "unknown";

const uniqueValues = (values) => [...new Set(values.filter(Boolean))];

const getSmsRecipients = (parcel) =>
  uniqueValues([parcel.senderPhone, parcel.receiverPhone]);

const getEmailRecipients = (parcel) =>
  uniqueValues([parcel.senderEmail, parcel.receiverEmail]);

const isSmsConfigured = () =>
  Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER,
  );

const isEmailConfigured = () =>
  Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_FROM &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS,
  );

let smsClient;
let emailTransporter;

const getSmsClient = () => {
  if (!smsClient) {
    smsClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  return smsClient;
};

const getEmailTransporter = () => {
  if (!emailTransporter) {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return emailTransporter;
};

const buildNotificationContent = ({ parcel, status, note, location }) => {
  const statusLabel = formatStatus(status);
  const noteText = note ? `Note: ${note}` : "No additional note provided.";
  const locationText = location
    ? `Current location: ${location}`
    : "Current location not provided.";

  return {
    sms: `CourierFlow update for ${parcel.trackingId}: status changed to ${statusLabel}. ${noteText}`,
    subject: `CourierFlow update: ${parcel.trackingId} is now ${statusLabel}`,
    text: [
      `Tracking ID: ${parcel.trackingId}`,
      `New status: ${statusLabel}`,
      noteText,
      locationText,
      `Receiver: ${parcel.receiverName}`,
      `Address: ${parcel.receiverAddress}`,
    ].join("\n"),
  };
};

export const notifyParcelStatusChange = async ({
  parcel,
  status,
  note,
  location,
}) => {
  const smsRecipients = getSmsRecipients(parcel);
  const emailRecipients = getEmailRecipients(parcel);
  const content = buildNotificationContent({ parcel, status, note, location });
  const jobs = [];

  if (isSmsConfigured() && smsRecipients.length > 0) {
    const client = getSmsClient();
    jobs.push(
      ...smsRecipients.map((to) =>
        client.messages.create({
          body: content.sms,
          from: process.env.TWILIO_FROM_NUMBER,
          to,
        }),
      ),
    );
  }

  if (isEmailConfigured() && emailRecipients.length > 0) {
    const transporter = getEmailTransporter();
    jobs.push(
      transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: emailRecipients.join(", "),
        subject: content.subject,
        text: content.text,
      }),
    );
  }

  if (jobs.length === 0) {
    return {
      skipped: true,
      reason: "No configured notification providers or recipients",
    };
  }

  const results = await Promise.allSettled(jobs);
  const failures = results.filter((result) => result.status === "rejected");

  if (failures.length > 0) {
    console.error(
      "Notification delivery failures:",
      failures.map((failure) => failure.reason?.message || failure.reason),
    );
  }

  return {
    skipped: false,
    attempted: jobs.length,
    failed: failures.length,
  };
};
