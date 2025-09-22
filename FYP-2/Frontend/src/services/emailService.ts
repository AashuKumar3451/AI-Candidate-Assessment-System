import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'PkUB3Cb2ifiTtnZf3', // Your EmailJS public key
  SERVICE_ID: 'service_kh39vnc', // Your EmailJS service ID
  TEMPLATE_ID: 'template_892gdwr', // Single template for all email types
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

export interface EmailData {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  testLink?: string;
  interviewDate?: string;
  interviewTime?: string;
  hrName?: string;
  hrEmail?: string;
  emailType?: 'test_accept' | 'test_reject' | 'interview_accept' | 'interview_reject';
}

export class EmailService {
  /**
   * Send email to candidate based on type
   */
  static async sendEmail(data: EmailData): Promise<boolean> {
    try {
      if (!data.emailType) {
        throw new Error('Email type is required for sendEmail method');
      }
      
      // Generate dynamic content based on email type
      const emailContent = this.generateEmailContent(data);

      const templateParams = {
        candidate_name: data.candidateName,
        candidate_email: data.candidateEmail,
        job_title: data.jobTitle,
        company_name: data.companyName,
        hr_name: data.hrName || 'HR Team',
        hr_email: data.hrEmail || 'hr@company.com',
        email_type: data.emailType,
        email_subject: emailContent.subject,
        email_body: emailContent.body,
        test_link: data.testLink || '',
        interview_date: data.interviewDate || '',
        interview_time: data.interviewTime || '',
      };

      const result = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
      );

      console.log(`✅ ${data.emailType} email sent successfully:`, result);
      return result.status === 200;
    } catch (error) {
      console.error(`❌ Failed to send ${data.emailType} email:`, error);
      return false;
    }
  }

  /**
   * Generate email content based on type
   */
  private static generateEmailContent(data: EmailData) {
    switch (data.emailType) {
      case 'test_accept':
        return {
          subject: `Congratulations! You've been selected for the test - ${data.jobTitle}`,
          body: `
            <p>Dear ${data.candidateName},</p>
            <p>Congratulations! We are pleased to inform you that you have been selected to proceed to the next stage for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.</p>
            <p>You are invited to take an online assessment test. Please click the link below to start your test:</p>
            <p><a href="${data.testLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Start Your Test</a></p>
            <p>Please complete the test at your earliest convenience.</p>
            <p>If you have any questions, feel free to contact us.</p>
            <p>Best regards,<br>The ${data.hrName || 'HR'} Team</p>
          `
        };

      case 'test_reject':
        return {
          subject: `Update on your application for ${data.jobTitle} at ${data.companyName}`,
          body: `
            <p>Dear ${data.candidateName},</p>
            <p>Thank you for your interest in the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong> and for taking the time to apply.</p>
            <p>We appreciate you sharing your qualifications and experience with us. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.</p>
            <p>This was a highly competitive search, and we received a large number of applications from many qualified candidates. We wish you the best of luck in your job search and future endeavors.</p>
            <p>Thank you again for your interest in ${data.companyName}.</p>
            <p>Sincerely,<br>The ${data.hrName || 'HR'} Team</p>
          `
        };

      case 'interview_accept':
        return {
          subject: `Interview Invitation for ${data.jobTitle} at ${data.companyName}`,
          body: `
            <p>Dear ${data.candidateName},</p>
            <p>Following up on your application for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>, we would like to invite you for an interview.</p>
            <p>Your interview has been scheduled for:</p>
            <ul>
              <li><strong>Date:</strong> ${data.interviewDate || 'TBD'}</li>
              <li><strong>Time:</strong> ${data.interviewTime || 'TBD'}</li>
            </ul>
            <p>Further details regarding the interview format (e.g., virtual meeting link, physical location) will be sent in a separate communication or confirmed shortly.</p>
            <p>Please confirm your availability for this interview by replying to this email. If the proposed time does not work for you, please let us know your preferred availability, and we will do our best to accommodate.</p>
            <p>We look forward to speaking with you!</p>
            <p>Best regards,<br>The ${data.hrName || 'HR'} Team</p>
          `
        };

      case 'interview_reject':
        return {
          subject: `Update on your application for ${data.jobTitle} at ${data.companyName}`,
          body: `
            <p>Dear ${data.candidateName},</p>
            <p>Thank you for your continued interest in the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong> and for participating in our interview process.</p>
            <p>We appreciate you taking the time to meet with our team and share more about your experience. We received a significant number of applications and interviewed many highly qualified candidates.</p>
            <p>After careful consideration, we have decided to move forward with other candidates whose qualifications and experience were a closer match for the specific requirements of this role at this time.</p>
            <p>We wish you the very best in your job search and future career endeavors.</p>
            <p>Thank you again for your interest in ${data.companyName}.</p>
            <p>Sincerely,<br>The ${data.hrName || 'HR'} Team</p>
          `
        };

      default:
        return {
          subject: `Update on your application for ${data.jobTitle}`,
          body: `<p>Dear ${data.candidateName},</p><p>Thank you for your interest in ${data.companyName}.</p>`
        };
    }
  }

  // Convenience methods for backward compatibility
  static async sendTestAcceptanceEmail(data: Omit<EmailData, 'emailType'>): Promise<boolean> {
    return this.sendEmail({ ...data, emailType: 'test_accept' });
  }

  static async sendTestRejectionEmail(data: Omit<EmailData, 'emailType'>): Promise<boolean> {
    return this.sendEmail({ ...data, emailType: 'test_reject' });
  }

  static async sendInterviewAcceptanceEmail(data: Omit<EmailData, 'emailType'>): Promise<boolean> {
    return this.sendEmail({ ...data, emailType: 'interview_accept' });
  }

  static async sendInterviewRejectionEmail(data: Omit<EmailData, 'emailType'>): Promise<boolean> {
    return this.sendEmail({ ...data, emailType: 'interview_reject' });
  }
}

export default EmailService;
