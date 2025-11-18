const { sendEmail, verifyEmailConfig } = require('../utils/emailService');
require('dotenv').config();

const testEmail = async () => {
  try {
    console.log('🧪 Testing Email Service...\n');

    // Check configuration
    console.log('📋 Checking email configuration...');
    const isConfigured = await verifyEmailConfig();
    
    if (!isConfigured) {
      console.error('❌ Email service is not configured!');
      console.log('\nRequired environment variables:');
      console.log('  - EMAIL_HOST');
      console.log('  - EMAIL_PORT');
      console.log('  - EMAIL_USER');
      console.log('  - EMAIL_PASS');
      console.log('\nCurrent configuration:');
      console.log('  EMAIL_HOST:', process.env.EMAIL_HOST || 'Not set');
      console.log('  EMAIL_PORT:', process.env.EMAIL_PORT || 'Not set');
      console.log('  EMAIL_USER:', process.env.EMAIL_USER ? 'Set ✓' : 'Not set ✗');
      console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set ✓' : 'Not set ✗');
      process.exit(1);
    }

    console.log('✅ Email service is configured\n');

    // List of email recipients
    const recipients = [
      'marothihemasundar03@gmail.com',
      'deepthideepu594@gmail.com',
      'harijanasruthi69@gmail.com',
      'butrabhavyasree810@gmail.com',
      'lalearchana8838@gmail.com',
      'varshinikotha04@gmail.com',
      'sailajakavali88@gmail.com',
      'angadidarshitha@gmail.com',
      'devireddygnaneswarreddy@gmail.com',
      'tejaswinikar30@gmail.com',
      'himavarshini958@gmail.com',
      '54suryaprakash54@gmail.com',
      'luckysaiv497@gmail.com',
      'akshayashok20045@gmail.com',
      'ashmithtr78@gmail.com',
      'vyshnavvijayan22@gmail.com',
      'jerin3821@gmail.com',
      'jeromebiju2003@gmail.com',
      'lalvinvarghese41@gmail.com',
      'kiranshijo79@gmail.com',
      'archanarajendran0223@gmail.com',
      'donalddevassykutty@gmail.com',
      'basudav728@gmail.com',
      'anjanaks9539@gmail.com',
      'bbnaveenkumar51@gmail.com',
      'challasaiswarup@gmail.com',
      'arfiya424@gmail.com',
      'tejam8600@gmail.com',
      'malleshbalamallesh07@gmail.com',
      'poojiputtaparthi@gmail.com',
      'ukeerthana1212@gmail.com',
      'rk4505228@gmail.com',
      'mahimahi5323@gmail.com',
      'meghamegha90884@gmail.com',
      'maruthi4687@gmail.com',
      'shailkirfan897720@gmail.com',
      'veeraboinapavan4@gmail.com',
      'gongativishnuvardhanr@gmail.com',
      'koraganeshreddy@gmail.com',
      'varunkumarreddybandi67@gmail.com',
      'sweetkillersweetkillerdastagir@gmail.com',
      'sivaanandreddy11@gmail.com',
      'eharichandra510@gmail.com',
      '22sajiyaec039@gmail.com',
      'roshanrai8895155314@gmail.com',
      'abintj2004@gmail.com',
      'thomsonthomasp2004@gmail.com',
      'midhulmartin10@gmail.com',
      'athlvj03@gmail.com',
      'anandhuharidas288@gmail.com',
      'leonbenny776@gmail.com',
      'hareeshkrishna2005@gmail.com',
      'ajaykrishnan766@gmail.com',
      'sreehariravi401@gmail.com',
      'sanjoshajan095@gmail.com',
      'amithkrishna17@gmail.com',
      'dheerajcm31@gmail.com',
      'anirudhtk85@gmail.com',
      'ajmalpmgvr@gmail.com',
      'akashpsatheesh562@gmail.com',
      'sayanthck11@gmail.com',
      'aryamuthara605@gmail.com',
      'shithinms100@gmail.com',
      'joyaljimmy04@gmail.com',
      'alwynvarghese989@gmail.com',
      'nsadithyansunil2005@gmail.com',
      'sanjaykrishna7577@gmail.com',
      'ebinkj013@gmail.com',
      'jistogeorge31@gmail.com',
      'biramalliumesa@gmail.com',
      'suhailshakzz@gmail.com',
      'adhiks.5453@gmail.com',
      'tagoresai115@gmail.com',
      'satyamchoudhary27102007@gmail.com',
      'bodajayanthi0@gmail.com',
      'aluruhaneef1@gmail.com',
      'bogamanil69@gmail.com',
      'navyamuntimadugu@gmail.com',
      'divitithanuja@gmail.com',
      'vinushayadav97@gmail.com',
      'lavanyasake17@gmail.com',
      'antonythomas3570@gmail.com',
      'k.thanmaii007@gmail.com',
      'kalaguriprasads@gmail.com',
      'ganeshreddygandlapenta@gmail.com',
      'potturupramod@gmail.com',
      'jawlakarsushanth@gmail.com',
      'jogannagariushausha@gmail.com',
      'mulintynikitha@gmail.com',
      'peramrenukareddy2006@gmail.com',
      'sreenivasj467@gmail.com',
      'pushparoyal431@gmail.com',
      'kpallavireddy2007@gmail.com',
      'janampallisadiya@gmail.com',
      'reddyvinay6146@gmail.com',
      'pamisettydevip@gmail.com',
      'rdharanidharani51@gmail.com',
      'somunemakallu2004@gmail.com',
      'kiran778044@gmail.com',
      'shaikarbaazsa29@gmail.com',
      'sruthivenkata2007@gmail.com',
      'jaswithapalyam@gmail.com',
      'kaveriiragamreddy@gmail.com',
      'chinnarajeswari66@gmail.com',
      'kurubaraji2006@gmail.com',
      'romanreignsrr120@gmail.com',
      'kumarsravan57748@gmail.com',
      'malleswarikovuri@gmail.com',
      'n.madhavasai9@gmail.com',
      'jakkalavadikisaiprathapreddy@gmail.com',
      'harshithayadav834@gmail.com',
      'ppraneeth054@gmail.com',
      'shaktiprasad275@gmail.com',
      'guttahasanthi@gmail.com',
      'aluruhemanth505@gmail.com',
      'mounikagopa2005@gmail.com',
      'chinthakalyankumar8@gmai.com',
      'kudannaikmahammadrafi@gmail.com',
      'tharunnaik973@gmail.com',
      'tarunabbineni@gmail.com',
      'maheswarikuruva381@gmail.com',
      'bhadrachinna333@gmail.com',
      'yerukulamohan67@gmail.com',
      'dvenkateshulu360@gmail.com',
      'ramuanitha815@gmail.com',
      'mnagabhushana22@gmail.com',
      'ashokbejjala7@gmail.com',
      'maithri.n06@gmail.com',
      'suseelaamruthaboddhula@gmail.com',
      'sankaranandakishore6300@gmail.com',
      'sugunavarshitha2007@gmail.com',
      'akshithaambakapalli@gmail.com',
      'sonuangelsonu40@gmail.com',
      'subahansubahan934@gmail.com',
      'krishnachaitanyakrishna62@gmail.com',
      'mufeedmufeed242@gmail.com',
      'ssudharshanchinna@gmail.com',
      'anjiediga2007@gmail.com',
      'gorakatinavaneetha@gmail.com',
      'vbhaskarvijayanagarambhaskar@gmail.com',
      'mallikarjunat822@gmail.com',
      'dudekularahim1234@gmail.com',
      'manojm998554@gmail.com',
      'mediumesh3333@gmail.com',
      'nallamadakgghb@gmail.com',
      'gnaneswar560@gmail.com',
      'palegaranandhabhupathiraju09@gmail.com',
      'nihalvn664@gmail.com',
      'vidhusagar2@gmail.com',
      'nikhiludhayan1903@gmail.com',
      'sanjayodkr@gmail.com',
      'jithinm25082002@gmail.com',
      'riyan61riyan@gmail.com',
      'ansif032@gmail.com',
      'muhammedshafi22223@gmail.com',
      'akshayonly9@gmail.com',
      'muhammedshihab226688@gmail.com',
      'sajin6111@gmail.com',
      'gonehalmahesh000@gmail.com',
      'royalmahidhar01@gmail.com',
      'nshivakrishna01@gmail.com',
      'sunnygaming955@gmail.com',
      'pk5596594@gmail.com',
      'joshvarithikpushparaj@gmail.com',
      'naniakhil7860@gmail.com',
      'rmanuraj3@gmail.com',
      'manyapushpajan@gmail.com',
      'alwinraphy999@gmail.com',
      'mufeedmufe007@gmail.com',
      'adharshmsadharshms733@gmail.com',
      'akhilparthan2002@gmail.com',
      'narayananasha25@gmail.com',
      'ismailismail99551@gmail.com',
      'muhammedshafeeku24@gmail.com',
      'jephinaugustine18@gmail.com',
      'stephin359@gmail.com',
      'edwinraphel2005@gmail.com',
      'ajuajumal78789878@gmail.com',
      'amalnathpspuliyakode@gmail.com',
      'siyadtk562003@gmail.com',
      'resteenf@gmail.com',
      'jerrinjoyson19@gmail.com',
      'reddypraveenkumar92@gmail.com',
      'marotinani06@gmail.com',
      'nadimintihemalatha96@gmail.com',
      'hemasaiamujuri3@gmail.com',
      'marothihemasundar03@gmail.com',
      'gireeshpurli@gmail.com',
      'krishnaballanki69@gmail.com',
      'podugucharan95@gmail.com',
      'madabatthulasravanthrakesh@gmail.com',
      'krishnavenigadi11@gmail.com',
      'crvcrv114@gmail.com',
      'ganapathipanchireddy0@gmail.com',
      'kumarlikhith27@gmail.com',
      'bangarujoes@gmail.com',
      'teja2626swar@gmail.com',
      'pradeep@gmail.com',
      'chintadaprasad12@gmail.com',
      'sravyasrimusirana@gmail.com',
      'sravankoncha@gmail.com',
      'sathwik333chand@gmail.com',
      'bandarumadhuri32@gmail.com',
      'ponnanahema@gmail.com',
      'rameshstudy1234@gmail.com',
      'kundrapukumarswamy74@gmail.com',
      'naravadilleswararao1315@gmail.com',
      'podugucharan81@gmail.com',
      'rajitha9410@gmail.com',
      'sairutwik1123@gmail.com',
      'adinigowthami@gmail.com',
      'sutarisuchitra141@gmail.com',
      'mohansivaram2007@gmail.com',
      'narayanamurthykarnayana@gmail.com',
      'hemasundarmaroti@gmail.com',
      'hmmhmm@gmail.com',
      'sadfsafd@gmail.com',
      'shanmukharaoadapaka123@gmail.com',
      'akashvenkat4454@gmail.com',
      'tmgcewziubpoqwq@suiemail.com',
      'notforuse982@gmail.com',
      'hiteshganni007@gmail.com',
      'sam0cypher@gmail.com',
      'kiransomulakiran@gmail.com',
      'gptgamerz51@gmail.com',
      'jamisabareesh74@gmail.com',
      'lohithvasantha50@gmail.com',
      'deepikajagarana2007@gmail.com',
      'moditeja029@gmail.com',
      'gopal.antyakula19@gmail.com',
      'marotikesava@gmail.com',
      'teja4028@gmail.com',
      'abhichichulla@gmail.com',
      'dasarimaneesha91@gmail.com',
      'krishnaballanki472@gmail.com',
      'kummaritirupathi8@gmail.com',
      'mrroodboy1@gmail.com',
      'ananthasaiananthasai40@gmail.com',
      'chirikikishorkumar@gmail.com',
      'gowthamiec020@gmail.com',
      'rohithvarri98@gmail.com',
      'umashankarnaidu71@gmail.com',
      'kick@123gmail.com',
      'ricky27333@gmail.com',
      'shaikkarimulla2438@gmail.com',
      'vyaswanth183@gmail.com',
      'Ponnadathanuja691@gmail.com',
      'jahnavi@2008gmail.com',
      'mysterioustruths23@gmail.com',
      'ethicalhacker3568@gmail.com',
      'thatigouthami95@gmail.com',
      'sumiyonukonduri@gmail.com',
      'jayashreenaidu04@gmail.com',
      'manichindiri@gmail.com',
      'magesh12092004@gmail.com',
      'vajjathanuja@gmail.com',
      'himahasini.kallepalli@gmail.com',
      'gowthamkalahasti@gmail.com',
      'nadimintihemalatha7@gmail.com',
      'sudarsanpalavalasa@gmail.com',
      'mahalakshmikonna365@gmail.com',
      'saichandubondala9177@gmail.com',
      '21065chb@gmail.com',
      'saitrinadhh@gmail.com',
      'naveenallu.2008@gmail.com',
      'harikagummadi360@gmail.com',
      'lakshmivangapandu88@gmail.com',
      'smilykingtejasaikumar@gmail.com',
      'yamunathuta1@gmail.com',
      'jyothsnapatnana@gmail.com',
      'mahavumatha@gmail.com',
      'pogirihari617@gmail.com',
      'ravipothamsetti51@gmail.com',
    ];

    console.log(`📧 Sending Telugu Info welcome emails to ${recipients.length} recipients...\n`);

    // Email content
    const subject = '📢 Join Telugu Info - Get Daily Job Updates & Career Guidance!';

    const text = `Hello!

Are you looking for job opportunities and career guidance? Join Telugu Info today!

WHAT WE OFFER:
→ Daily Job Updates (Govt & Private)
→ Free Study Materials
→ Scholarship Alerts
→ Career Guidance
→ Interview Tips
→ Exam Notifications

JOIN OUR COMMUNITY:
WhatsApp: Scan the QR code in the HTML version of this email or click here:
https://whatsapp.com/channel/0029Vb7K4xO1noz27fvVPG28

MANDATORY: After joining the WhatsApp channel, please create your account on our website.
Create your account: https://telugu-info.vercel.app

Website: https://telugu-info.vercel.app
Instagram: https://www.instagram.com/mr_mca_00
Facebook: https://www.facebook.com/profile.php?id=100088840030113
LinkedIn: https://www.linkedin.com/in/hemasundar-maroti

WHY TELUGU INFO?
• 100% Verified Information
• Daily Updates
• Free Access
• Quick Support
• User-Friendly Platform
• Active Community

Don't wait! Join 10,000+ members already benefiting from our services.

📝 WE VALUE YOUR FEEDBACK:
Your feedback is important to us! Please share your thoughts, suggestions, or any issues you face. This helps us improve our services for everyone.

Send your feedback to: marotinani06@gmail.com
Subject: "Feedback for Telugu Info"

Or use our online feedback form: https://telugu-info.vercel.app/feedback

Need help? Contact us:
📞 +91 7036180813
📧 marotinani06@gmail.com

Best regards,  
Telugu Info Team`;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
  <div style="background: #1a237e; color: white; padding: 30px; text-align: center; border-radius: 10px;">
    <h1 style="margin: 0; font-size: 28px;">📢 Join Telugu Info Today!</h1>
    <p style="margin: 10px 0 0; font-size: 18px;">Get Daily Job Updates & Career Guidance</p>
  </div>

  <div style="margin: 30px 0; font-size: 16px; line-height: 1.5;">
    <p style="font-size: 18px; font-weight: bold; color: #1a237e;">Looking for job opportunities and career guidance?</p>
    <p>Join our growing community of 10,000+ members!</p>
  </div>
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
    <h2 style="color: #1a237e; margin-top: 0;">What We Offer:</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div style="background: white; padding: 15px; border-radius: 8px;">
        <p style="margin: 0;">→ Daily Job Updates</p>
      </div>
      <div style="background: white; padding: 15px; border-radius: 8px;">
        <p style="margin: 0;">→ Free Study Materials</p>
      </div>
      <div style="background: white; padding: 15px; border-radius: 8px;">
        <p style="margin: 0;">→ Scholarship Alerts</p>
      </div>
      <div style="background: white; padding: 15px; border-radius: 8px;">
        <p style="margin: 0;">→ Career Guidance</p>
      </div>
      <div style="background: white; padding: 15px; border-radius: 8px;">
        <p style="margin: 0;">→ Interview Tips</p>
      </div>
      <div style="background: white; padding: 15px; border-radius: 8px;">
        <p style="margin: 0;">→ Exam Notifications</p>
      </div>
    </div>
  </div>

  <div style="background: #25D366; color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
    <h2 style="margin-top: 0;">Join Our WhatsApp Channel</h2>
    <p style="margin: 10px 0;">Scan QR Code to Join!</p>
    <div style="background: white; padding: 20px; border-radius: 10px; display: inline-block; margin: 15px 0;">
      <img src="https://i.ibb.co/wNn7jsfy/IMG-20251013-113642.jpg" alt="Telugu Info WhatsApp Channel QR Code" style="width: 200px; height: 200px; display: block; margin: 0 auto;">
    </div>
    <p style="margin: 10px 0;">Or click the button below</p>
    <a href="https://whatsapp.com/channel/0029Vb7K4xO1noz27fvVPG28" 
       style="background: white; color: #25D366; padding: 12px 25px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; margin-top: 10px;">
       Join WhatsApp Channel →
    </a>
    <div style="background:#fff3cd; color:#856404; padding:16px; border-radius:8px; margin-top:16px;">
      <strong>Important:</strong> After joining our WhatsApp channel, please create your account on our website to get personalized alerts and save your preferences.
      <div style="margin-top:12px;">
        <a href="https://telugu-info.vercel.app" style="background:#1a237e; color:#ffffff; padding:10px 18px; text-decoration:none; border-radius:6px; font-weight:bold;">Create your account</a>
      </div>
    </div>
  </div>

  <div style="margin: 30px 0; text-align: center;">
    <h2 style="color: #1a237e;">Connect With Us</h2>
    <div style="margin: 20px 0;">
      <a href="https://telugu-info.vercel.app" style="display: inline-block; margin: 5px; padding: 10px 20px; background: #1a237e; color: white; text-decoration: none; border-radius: 5px;">🌐 Website</a>
      <a href="https://www.instagram.com/mr_mca_00" style="display: inline-block; margin: 5px; padding: 10px 20px; background: #E4405F; color: white; text-decoration: none; border-radius: 5px;">📸 Instagram</a>
      <a href="https://www.facebook.com/profile.php?id=100088840030113" style="display: inline-block; margin: 5px; padding: 10px 20px; background: #1877F2; color: white; text-decoration: none; border-radius: 5px;">👥 Facebook</a>
      <a href="https://www.linkedin.com/in/hemasundar-maroti" style="display: inline-block; margin: 5px; padding: 10px 20px; background: #0077B5; color: white; text-decoration: none; border-radius: 5px;">💼 LinkedIn</a>
    </div>
  </div>

  <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
    <h2 style="color: #1a237e; margin-top: 0;">Why Choose Telugu Info?</h2>
    <ul style="list-style-type: none; padding: 0; margin: 0;">
      <li style="padding: 10px; background: white; margin: 5px 0; border-radius: 5px;">• 100% Verified Information</li>
      <li style="padding: 10px; background: white; margin: 5px 0; border-radius: 5px;">• Daily Updates</li>
      <li style="padding: 10px; background: white; margin: 5px 0; border-radius: 5px;">• Free Access</li>
      <li style="padding: 10px; background: white; margin: 5px 0; border-radius: 5px;">• Quick Support</li>
      <li style="padding: 10px; background: white; margin: 5px 0; border-radius: 5px;">• User-Friendly Platform</li>
    </ul>
  </div>

  <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #1a237e;">
    <h2 style="color: #1a237e; margin-top: 0;">📝 We Value Your Feedback</h2>
    <p style="margin: 10px 0; font-size: 16px; line-height: 1.6;">Your feedback is important to us! Please share your thoughts, suggestions, or any issues you face. This helps us improve our services for everyone.</p>
    <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <p style="margin: 5px 0; font-weight: bold; color: #1a237e;">Send your feedback to:</p>
      <p style="margin: 5px 0;">📧 <a href="mailto:marotinani06@gmail.com?subject=Feedback for Telugu Info" style="color: #1a237e; text-decoration: none; font-weight: bold;">marotinani06@gmail.com</a></p>
      <p style="margin: 5px 0; font-size: 14px; color: #666;">Subject: "Feedback for Telugu Info"</p>
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
        <p style="margin: 5px 0; font-weight: bold; color: #1a237e;">Or use our online feedback form:</p>
        <a href="https://telugu-info.vercel.app/feedback" style="background: #1a237e; color: white; padding: 8px 16px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">📝 Submit Feedback Online</a>
      </div>
    </div>
  </div>

  <div style="text-align: center; margin-top: 30px; padding: 20px; background: #1a237e; color: white; border-radius: 10px;">
    <h2 style="margin-top: 0;">Contact Us</h2>
    <p style="margin: 10px 0;">
      📞 <a href="tel:+917036180813" style="color: white; text-decoration: none;">+91 7036180813</a><br>
      📧 <a href="mailto:marotinani06@gmail.com" style="color: white; text-decoration: none;">marotinani06@gmail.com</a>
    </p>
  </div>
</div>`;

    // Send emails to all recipients
    let successCount = 0;
    let failureCount = 0;
    const failedEmails = [];

    for (let i = 0; i < recipients.length; i++) {
      const email = recipients[i];
      try {
        console.log(`[${i + 1}/${recipients.length}] Sending email to: ${email}`);
        
        const result = await sendEmail({
          to: email,
          subject: subject,
          html: html,
          text: text,
        });
        
        if (result.success) {
          console.log(`✅ Email sent successfully to: ${email}`);
          successCount++;
        } else {
          console.error(`❌ Failed to send email to ${email}:`, result.error || result.message);
          failureCount++;
          failedEmails.push({ email, error: result.error || result.message });
        }
        
        // Add a small delay between emails to avoid rate limiting (1 second)
        if (i < recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Error sending email to ${email}:`, error.message);
        failureCount++;
        failedEmails.push({ email, error: error.message });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Email Sending Summary:');
    console.log('='.repeat(60));
    console.log(`Total recipients: ${recipients.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    
    if (failedEmails.length > 0) {
      console.log('\n❌ Failed Emails:');
      failedEmails.forEach(({ email, error }) => {
        console.log(`   - ${email}: ${error}`);
      });
    }
    
    console.log('='.repeat(60) + '\n');

    if (failureCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Fatal error in email test:', error.message);
    process.exit(1);
  }
};

// Run the test
testEmail();