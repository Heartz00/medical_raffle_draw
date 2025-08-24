// utils/emailService.js
import emailjs from "emailjs-com";

const EMAILJS_SERVICE_ID =
  process.env.REACT_APP_EMAILJS_SERVICE_ID || "service_ccmymuk";
const EMAILJS_TEMPLATE_ID =
  process.env.REACT_APP_EMAILJS_TEMPLATE_ID || "template_49o83b6";
const EMAILJS_USER_ID =
  process.env.REACT_APP_EMAILJS_USER_ID || "Ptmb_rR6hoRn-5ghD";

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sendWinnerEmail = async (winner, emailContent) => {
  try {
    // Check if we have a valid email address
    const recipientEmail = winner.respondent_email;

    if (!recipientEmail) {
      throw new Error(
        `No email address found for winner: ${
          winner.name || winner.respondent_name
        }`
      );
    }

    if (!isValidEmail(recipientEmail)) {
      throw new Error(
        `Invalid email format for winner: ${
          winner.respondent_name || winner.name
        } - ${recipientEmail}`
      );
    }

    const recipientName =
      winner.respondent_name ||
      winner.respondent_email ||
      winner.name ||
      "Valued Participant";

    const templateParams = {
      to_name: recipientName,
      to_email: recipientEmail,
      from_name: "Medical Imaging Research Team",
      subject: emailContent.subject,
      message: emailContent.body.replace("Winner", recipientName),
      facility_name: winner.name,
      prize_amount: "$500",
      reply_to: "research@medicalimaging.org",
    };

    console.log(
      "Sending email to:",
      recipientEmail,
      "with params:",
      templateParams
    );

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_USER_ID
    );

    return { success: true, data: response };
  } catch (error) {
    console.error(
      "Error sending email to winner:",
      winner.name || winner.respondent_name,
      error
    );
    return {
      success: false,
      error,
      winner: winner.name || winner.respondent_name,
      email: winner.respondent_email,
    };
  }
};

export const sendBulkEmails = async (winners, emailContent) => {
  const results = [];
  const validWinners = winners.filter((winner) => {
    const email = winner.respondent_email;
    return email && isValidEmail(email);
  });

  if (validWinners.length === 0) {
    throw new Error("No winners with valid email addresses found");
  }

  console.log(
    `Sending emails to ${validWinners.length} winners with valid email addresses`
  );

  for (const winner of validWinners) {
    try {
      const result = await sendWinnerEmail(winner, emailContent);
      results.push({
        winner: winner.respondent_name,
        email: winner.respondent_email,
        success: result.success,
        error: result.error,
      });

      // Add a delay to avoid rate limiting (2 seconds between emails)
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(
        "Error in bulk email sending for winner:",
        winner.name,
        error
      );
      results.push({
        winner: winner.name,
        email: winner.respondent_email,
        success: false,
        error,
      });
    }
  }

  return results;
};

// Alternative method for manual email sending
export const prepareManualEmails = (winners, emailContent) => {
  const validWinners = winners.filter((winner) => {
    const email = winner.respondent_email;
    return email && isValidEmail(email);
  });

  if (validWinners.length === 0) {
    return null;
  }

  // Create mailto link for manual sending
  const emails = validWinners
    .map((winner) => winner.respondent_email)
    .join(",");
  const subject = encodeURIComponent(emailContent.subject);
  const body = encodeURIComponent(
    emailContent.body +
      "\n\n---\nThis email was sent to multiple winners of the Medical Imaging Raffle."
  );

  return `mailto:?bcc=${emails}&subject=${subject}&body=${body}`;
};
