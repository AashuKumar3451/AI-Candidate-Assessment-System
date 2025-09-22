import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_CONFIG = {
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
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
        email_message: this.getEmailMessage(data.emailType, data),
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
   * Get email message based on type
   */
  private static getEmailMessage(emailType: string, data: EmailData): string {
    switch (emailType) {
      case 'test_accept':
        return `Congratulations! We are pleased to inform you that you have been selected to proceed to the next stage for the ${data.jobTitle} position at ${data.companyName}. You are invited to take an online assessment test. Please click the link below to start your test: ${data.testLink}. Please complete the test at your earliest convenience. If you have any questions, feel free to contact us.`;
      
      case 'test_reject':
        return `Thank you for your interest in the ${data.jobTitle} position at ${data.companyName} and for taking the time to apply. We appreciate you sharing your qualifications and experience with us. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time. This was a highly competitive search, and we received a large number of applications from many qualified candidates. We wish you the best of luck in your job search and future endeavors.`;
      
      case 'interview_accept':
        return `Following up on your application for the ${data.jobTitle} position at ${data.companyName}, we would like to invite you for an interview. Your interview has been scheduled for: Date: ${data.interviewDate || 'TBD'}, Time: ${data.interviewTime || 'TBD'}. Further details regarding the interview format will be sent in a separate communication. Please confirm your availability for this interview by replying to this email. We look forward to speaking with you!`;
      
      case 'interview_reject':
        return `Thank you for your continued interest in the ${data.jobTitle} position at ${data.companyName} and for participating in our interview process. We appreciate you taking the time to meet with our team and share more about your experience. After careful consideration, we have decided to move forward with other candidates whose qualifications and experience were a closer match for the specific requirements of this role at this time. We wish you the very best in your job search and future career endeavors.`;
      
      default:
        return `Thank you for your interest in ${data.companyName}.`;
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
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Congratulations!</h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear <strong>${data.candidateName}</strong>,</p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Congratulations! We are pleased to inform you that you have been selected to proceed to the next stage for the 
                <strong style="color: #2c3e50;">${data.jobTitle}</strong> position at 
                <strong style="color: #2c3e50;">${data.companyName}</strong>.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                You are invited to take an online assessment test. Please click the button below to start your test:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.testLink}" 
                   style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                  Start Your Test
                </a>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Please complete the test at your earliest convenience. If you have any questions, feel free to contact us.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Best regards,<br>
                <strong>The ${data.hrName || 'HR'} Team</strong>
              </p>
              
              <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
              <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          `
        };

      case 'test_reject':
        return {
          subject: `Update on your application for ${data.jobTitle} at ${data.companyName}`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">Application Update</h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear <strong>${data.candidateName}</strong>,</p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Thank you for your interest in the <strong style="color: #2c3e50;">${data.jobTitle}</strong> position at 
                <strong style="color: #2c3e50;">${data.companyName}</strong> and for taking the time to apply.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                We appreciate you sharing your qualifications and experience with us. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                This was a highly competitive search, and we received a large number of applications from many qualified candidates. We wish you the best of luck in your job search and future endeavors.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Thank you again for your interest in <strong>${data.companyName}</strong>.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Sincerely,<br>
                <strong>The ${data.hrName || 'HR'} Team</strong>
              </p>
              
              <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
              <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          `
        };

      case 'interview_accept':
        return {
          subject: `Interview Invitation for ${data.jobTitle} at ${data.companyName}`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50; border-bottom: 2px solid #27ae60; padding-bottom: 10px;">Interview Invitation</h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear <strong>${data.candidateName}</strong>,</p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Following up on your application for the <strong style="color: #2c3e50;">${data.jobTitle}</strong> position at 
                <strong style="color: #2c3e50;">${data.companyName}</strong>, we would like to invite you for an interview.
              </p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #2c3e50; margin-top: 0;">Interview Details:</h3>
                <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 5px 0;">
                  <strong>Date:</strong> ${data.interviewDate || 'TBD'}
                </p>
                <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 5px 0;">
                  <strong>Time:</strong> ${data.interviewTime || 'TBD'}
                </p>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Further details regarding the interview format (e.g., virtual meeting link, physical location) will be sent in a separate communication or confirmed shortly.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Please confirm your availability for this interview by replying to this email. If the proposed time does not work for you, please let us know your preferred availability, and we will do our best to accommodate.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                We look forward to speaking with you!
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Best regards,<br>
                <strong>The ${data.hrName || 'HR'} Team</strong>
              </p>
              
              <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
              <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          `
        };

      case 'interview_reject':
        return {
          subject: `Update on your application for ${data.jobTitle} at ${data.companyName}`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">Interview Update</h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear <strong>${data.candidateName}</strong>,</p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Thank you for your continued interest in the <strong style="color: #2c3e50;">${data.jobTitle}</strong> position at 
                <strong style="color: #2c3e50;">${data.companyName}</strong> and for participating in our interview process.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                We appreciate you taking the time to meet with our team and share more about your experience. We received a significant number of applications and interviewed many highly qualified candidates.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                After careful consideration, we have decided to move forward with other candidates whose qualifications and experience were a closer match for the specific requirements of this role at this time.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                We wish you the very best in your job search and future career endeavors.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Thank you again for your interest in <strong>${data.companyName}</strong>.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Sincerely,<br>
                <strong>The ${data.hrName || 'HR'} Team</strong>
              </p>
              
              <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
              <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          `
        };

      default:
        return {
          subject: `Update on your application for ${data.jobTitle}`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear <strong>${data.candidateName}</strong>,</p>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Thank you for your interest in <strong>${data.companyName}</strong>.</p>
            </div>
          `
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
