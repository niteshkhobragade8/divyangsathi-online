// =========================================================
// DIVYANGSATHI FULL PAGE I18N
// English / Hindi / Marathi
// User + Admin Pages
// =========================================================

(function () {
  "use strict";

  // -------------------------------------------------------
  // EXACT TRANSLATIONS
  // -------------------------------------------------------

  const translations = {
    hi: {
      "Admin Dashboard": "एडमिन डैशबोर्ड",
      "Administrator Panel": "प्रशासक पैनल",
      "Dashboard": "डैशबोर्ड",
      "Analytics": "विश्लेषण",
      "Charts": "चार्ट",
      "User Profiles": "उपयोगकर्ता प्रोफ़ाइल",
      "All User Profiles": "सभी उपयोगकर्ता प्रोफ़ाइल",
      "Memberships": "सदस्यताएँ",
      "Membership": "सदस्यता",
      "Membership Requests": "सदस्यता अनुरोध",
      "Interests": "रुचियाँ",
      "Received Interests": "प्राप्त रुचियाँ",
      "Voice Requests": "वॉइस अनुरोध",
      "Aadhaar Requests": "आधार अनुरोध",
      "Face Verification": "चेहरा सत्यापन",
      "Aadhaar Verification": "आधार सत्यापन",
      "User Reports": "उपयोगकर्ता रिपोर्ट",
      "Contact Messages": "संपर्क संदेश",
      "Success Stories": "सफलता की कहानियाँ",
      "Broadcast": "प्रसारण",
      "Website Home": "वेबसाइट होम",
      "Website": "वेबसाइट",
      "Home": "होम",
      "Register": "पंजीकरण",
      "Login": "लॉगिन",
      "Logout": "लॉग आउट",
      "Admin Logout": "एडमिन लॉग आउट",
      "Profile": "प्रोफ़ाइल",
      "My Profile": "मेरी प्रोफ़ाइल",
      "Profile Information": "प्रोफ़ाइल जानकारी",
      "Profile Details": "प्रोफ़ाइल विवरण",
      "Search Profiles": "प्रोफ़ाइल खोजें",
      "Search Profile Filters": "प्रोफ़ाइल खोज फ़िल्टर",
      "Contact": "संपर्क",
      "Contact Us": "हमसे संपर्क करें",
      "Privacy Policy": "गोपनीयता नीति",
      "Terms & Conditions": "नियम और शर्तें",

      "Welcome Back, Administrator": "वापसी पर स्वागत है, प्रशासक",
      "DivyangSathi Admin Dashboard": "DivyangSathi एडमिन डैशबोर्ड",
      "Super Admin": "सुपर एडमिन",
      "Full Dashboard Access": "पूर्ण डैशबोर्ड पहुँच",

      "Pending": "लंबित",
      "Accepted": "स्वीकृत",
      "Rejected": "अस्वीकृत",
      "Approved": "स्वीकृत",
      "Verified": "सत्यापित",
      "Blocked": "ब्लॉक",
      "Active": "सक्रिय",
      "Offline": "ऑफ़लाइन",
      "Online": "ऑनलाइन",
      "Free": "मुफ़्त",
      "All": "सभी",
      "Total": "कुल",
      "Refresh": "रीफ़्रेश",
      "Resolved": "समाधान किया गया",

      "Total Users": "कुल उपयोगकर्ता",
      "Total Profiles": "कुल प्रोफ़ाइल",
      "Approved Profiles": "स्वीकृत प्रोफ़ाइल",
      "Blocked Profiles": "ब्लॉक प्रोफ़ाइल",
      "Total Interests": "कुल रुचियाँ",
      "Pending Reports": "लंबित रिपोर्ट",
      "Total Reports": "कुल रिपोर्ट",
      "Verified Users": "सत्यापित उपयोगकर्ता",
      "Premium Members": "प्रीमियम सदस्य",
      "Pending Membership": "लंबित सदस्यता",
      "Blocked Users": "ब्लॉक उपयोगकर्ता",
      "Registered Today": "आज पंजीकृत",
      "Registered This Month": "इस माह पंजीकृत",
      "Total Messages": "कुल संदेश",
      "Total User Reports": "कुल उपयोगकर्ता रिपोर्ट",

      "Monthly Registrations": "मासिक पंजीकरण",
      "Gender Distribution": "लिंग वितरण",
      "Membership Distribution": "सदस्यता वितरण",
      "Profile Verification Status": "प्रोफ़ाइल सत्यापन स्थिति",
      "State-wise Users": "राज्यवार उपयोगकर्ता",
      "Disability-wise Users": "दिव्यांगता के अनुसार उपयोगकर्ता",

      "Age": "आयु",
      "Gender": "लिंग",
      "State": "राज्य",
      "District": "जिला",
      "Education": "शिक्षा",
      "Occupation": "व्यवसाय",
      "Religion": "धर्म",
      "Income": "आय",
      "Disability": "दिव्यांगता",
      "Disability Type": "दिव्यांगता प्रकार",
      "Marital Status": "वैवाहिक स्थिति",
      "About Me": "मेरे बारे में",
      "Personal Information": "व्यक्तिगत जानकारी",
      "Partner Preference": "जीवनसाथी की पसंद",

      "Male": "पुरुष",
      "Female": "महिला",
      "Other": "अन्य",
      "Select Gender": "लिंग चुनें",
      "Select Marital Status": "वैवाहिक स्थिति चुनें",
      "Never Married": "अविवाहित",
      "Divorced": "तलाकशुदा",
      "Widowed": "विधवा/विधुर",
      "Minimum Age": "न्यूनतम आयु",
      "Maximum Age": "अधिकतम आयु",
      "Reset Filters": "फ़िल्टर रीसेट करें",

      "Send Interest": "रुचि भेजें",
      "Start Chat": "चैट शुरू करें",
      "View Profile": "प्रोफ़ाइल देखें",
      "Add to Favourite": "पसंदीदा में जोड़ें",
      "Download Profile PDF": "प्रोफ़ाइल PDF डाउनलोड करें",
      "Report User": "उपयोगकर्ता की रिपोर्ट करें",
      "Block User": "उपयोगकर्ता को ब्लॉक करें",

      "Recommended Matches": "सुझाए गए रिश्ते",
      "Best Matches for You": "आपके लिए सर्वोत्तम रिश्ते",
      "Update Preferences": "पसंद अपडेट करें",

      "Your Notifications": "आपकी सूचनाएँ",
      "Unread Notifications": "अपठित सूचनाएँ",
      "Notification Centre": "सूचना केंद्र",
      "Admin Notifications": "एडमिन सूचनाएँ",
      "Mark All as Read": "सभी को पढ़ा हुआ करें",
      "Mark all read": "सभी को पढ़ा हुआ करें",
      "No Notifications": "कोई सूचना नहीं",
      "No notifications.": "कोई सूचना नहीं।",

      "Membership Plans": "सदस्यता योजनाएँ",
      "Current Plan": "वर्तमान योजना",
      "Select Your Plan": "अपनी योजना चुनें",
      "Basic Account": "बेसिक खाता",
      "Starter Membership": "स्टार्टर सदस्यता",
      "Premium Membership": "प्रीमियम सदस्यता",
      "Ultimate Membership": "अल्टीमेट सदस्यता",
      "Choose Silver": "सिल्वर चुनें",
      "Choose Gold": "गोल्ड चुनें",
      "Choose Platinum": "प्लैटिनम चुनें",
      "Membership Payment": "सदस्यता भुगतान",
      "Selected Membership": "चुनी गई सदस्यता",
      "Plan": "योजना",
      "Amount": "राशि",
      "Scan and Pay": "स्कैन करके भुगतान करें",
      "Submit Payment Details": "भुगतान विवरण भेजें",
      "UTR / Transaction Number": "UTR / लेनदेन नंबर",
      "Submit Membership Request": "सदस्यता अनुरोध भेजें",
      "Admin Approval": "एडमिन स्वीकृति",

      "Profile Photo": "प्रोफ़ाइल फोटो",
      "Choose File": "फ़ाइल चुनें",
      "Camera": "कैमरा",
      "30 Sec Intro Video": "30 सेकंड परिचय वीडियो",
      "Record Video": "वीडियो रिकॉर्ड करें",
      "Upload Video": "वीडियो अपलोड करें",
      "Save Intro Video": "परिचय वीडियो सहेजें",
      "Voice Intro": "वॉइस परिचय",
      "Aadhaar Front": "आधार आगे का भाग",
      "Aadhaar Back": "आधार पीछे का भाग",
      "Upload Selfie": "सेल्फ़ी अपलोड करें",
      "Status": "स्थिति",
      "Not Uploaded": "अपलोड नहीं हुआ",

      "Welcome Back to DivyangSathi": "DivyangSathi में वापस स्वागत है",
      "Login to Your Account": "अपने खाते में लॉगिन करें",
      "Admin Login": "एडमिन लॉगिन",
      "Admin Email": "एडमिन ईमेल",
      "Admin Password": "एडमिन पासवर्ड",
      "Login as Admin": "एडमिन के रूप में लॉगिन करें",
      "Email Address": "ईमेल पता",
      "Password": "पासवर्ड",
      "Remember Me": "मुझे याद रखें",
      "Forgot Password?": "पासवर्ड भूल गए?",
      "Create New Account": "नया खाता बनाएँ",

      "Find Your Perfect Life Partner": "अपना सही जीवनसाथी खोजें",
      "Register Free": "मुफ़्त पंजीकरण करें",
      "Verified Profiles": "सत्यापित प्रोफ़ाइल",
      "Secure Platform": "सुरक्षित प्लेटफ़ॉर्म",
      "Inclusive Community": "समावेशी समुदाय",
      "Total Members": "कुल सदस्य",
      "Create Account": "खाता बनाएँ",
      "Complete Profile": "प्रोफ़ाइल पूरी करें",
      "Search & Connect": "खोजें और जुड़ें",

      "Submit Success Story": "सफलता की कहानी भेजें",
      "Partner Name": "जीवनसाथी का नाम",
      "Story Title": "कहानी का शीर्षक",
      "Marriage Date": "विवाह की तारीख",
      "City": "शहर",
      "Couple Photo": "जोड़े की फोटो",
      "Your Success Story": "आपकी सफलता की कहानी",

      "Dark": "डार्क",
      "Light": "लाइट",
      "Send": "भेजें",
      "Report": "रिपोर्ट",
      "Messages": "संदेश",
      "Favourites": "पसंदीदा",
      "Profile Views": "प्रोफ़ाइल व्यू",
      "Together Beyond Limits": "सीमाओं से परे साथ",
      "Professional Matrimony Platform for the Divyang Community.": "दिव्यांग समुदाय के लिए पेशेवर विवाह मंच।",
      "Quick Links": "त्वरित लिंक",
      "Support": "सहायता",
      "Full Name": "पूरा नाम",
      "Mobile Number": "मोबाइल नंबर",
      "Get Support": "सहायता लें",
      "Stay Safe": "सुरक्षित रहें",
      "Today": "आज",
      "Profile Status": "प्रोफ़ाइल स्थिति",
      "Incomplete": "अपूर्ण",
      "Free Member": "मुफ़्त सदस्य",
      "Verification": "सत्यापन",
      "Profile Completion": "प्रोफ़ाइल पूर्णता",
      "Complete Your Matrimony Profile": "अपनी विवाह प्रोफ़ाइल पूरी करें",
      "A complete profile receives better responses and suitable matches.": "पूरी प्रोफ़ाइल से बेहतर प्रतिक्रियाएँ और उपयुक्त रिश्ते मिलते हैं।",
      "Find suitable matches": "उपयुक्त रिश्ते खोजें",
      "Check premium status": "प्रीमियम स्थिति देखें",
      "Edit Profile": "प्रोफ़ाइल संपादित करें",
      "Update your details": "अपना विवरण अपडेट करें",
      "Contact DivyangSathi": "DivyangSathi से संपर्क करें",
      "Who Viewed My Profile": "मेरी प्रोफ़ाइल किसने देखी",
      "Unique Viewers": "अलग-अलग दर्शक",
      "Loading profile visitors...": "प्रोफ़ाइल दर्शक लोड हो रहे हैं...",
      "Keep your information complete, correct and updated.": "अपनी जानकारी पूरी, सही और अपडेट रखें।",
      "Premium Member": "प्रीमियम सदस्य",
      "Upload a clear profile photo. On mobile you can choose a file or use the camera.": "साफ प्रोफ़ाइल फोटो अपलोड करें। मोबाइल पर फ़ाइल चुनें या कैमरा उपयोग करें।",
      "Choose Profile Photo": "प्रोफ़ाइल फोटो चुनें",
      "JPG, PNG or WEBP": "JPG, PNG या WEBP",
      "Record a short introduction with your camera or upload an existing video.": "कैमरे से छोटा परिचय रिकॉर्ड करें या मौजूदा वीडियो अपलोड करें।",
      "Upload Intro Video": "परिचय वीडियो अपलोड करें",
      "Recommended: up to 30 seconds": "सुझाव: अधिकतम 30 सेकंड",
      "Upload clear Front and Back Aadhaar images for verification.": "सत्यापन के लिए आधार की आगे और पीछे की साफ तस्वीरें अपलोड करें।",
      "Upload a clear selfie for identity verification.": "पहचान सत्यापन के लिए साफ सेल्फ़ी अपलोड करें।",
      "30 Second Voice Intro": "30 सेकंड वॉइस परिचय",
      "Record": "रिकॉर्ड करें",
      "Stop": "रोकें",
      "Play": "चलाएँ",
      "Upload": "अपलोड करें",
      "Delete": "हटाएँ",
      "No voice recorded.": "कोई वॉइस रिकॉर्ड नहीं है।",
      "Gallery Photos": "गैलरी फोटो",
      "Add additional photos to make your profile more attractive.": "अपनी प्रोफ़ाइल को बेहतर बनाने के लिए अतिरिक्त फोटो जोड़ें।",
      "Add Gallery Photos": "गैलरी फोटो जोड़ें",
      "Basic Information": "मूल जानकारी",
      "Enter your basic account and identity details.": "अपने खाते और पहचान की मूल जानकारी दर्ज करें।",
      "Provide accurate personal and disability-related information.": "सही व्यक्तिगत और दिव्यांगता संबंधी जानकारी दें।",
      "Date of Birth": "जन्म तिथि",
      "Disability Percentage": "दिव्यांगता प्रतिशत",
      "Caste": "जाति",
      "Select": "चुनें",
      "Height": "ऊंचाई",
      "Weight": "वजन",
      "Education & Career": "शिक्षा और करियर",
      "Add your educational and professional details.": "अपनी शिक्षा और पेशे से जुड़ी जानकारी जोड़ें।",
      "Annual Income": "वार्षिक आय",
      "Location": "स्थान",
      "Enter your current residential location.": "अपना वर्तमान निवास स्थान दर्ज करें।",
      "Introduce yourself in a respectful and meaningful way.": "अपने बारे में सम्मानपूर्वक और सार्थक तरीके से लिखें।",
      "About Yourself": "अपने बारे में",
      "Describe the qualities you are looking for in a life partner.": "जीवनसाथी में जिन गुणों की अपेक्षा है उनका वर्णन करें।",
      "Preferred Age": "पसंदीदा आयु",
      "Preferred State": "पसंदीदा राज्य",
      "Preferred Disability": "पसंदीदा दिव्यांगता",
      "Additional Partner Preference": "अतिरिक्त जीवनसाथी पसंद",
      "Save Profile": "प्रोफ़ाइल सहेजें",
      "Deactivate Account": "खाता निष्क्रिय करें",
      "Request Account Deletion": "खाता हटाने का अनुरोध करें",
      "Login securely to complete your profile, search compatible matches and manage your membership.": "अपनी प्रोफ़ाइल पूरी करने, उपयुक्त रिश्ते खोजने और सदस्यता प्रबंधित करने के लिए सुरक्षित लॉगिन करें।",
      "Enter your registered email address and password": "अपना पंजीकृत ईमेल पता और पासवर्ड दर्ज करें",
      "Before Sending Your Message": "संदेश भेजने से पहले",
      "Clear Details": "स्पष्ट विवरण",
      "Correct Contact Details": "सही संपर्क विवरण",
      "Response Time": "उत्तर का समय",
      "Your Message": "आपका संदेश",
      "Subject": "विषय",
      "Send Message": "संदेश भेजें",
    },

    mr: {
      "Admin Dashboard": "ॲडमिन डॅशबोर्ड",
      "Administrator Panel": "प्रशासक पॅनेल",
      "Dashboard": "डॅशबोर्ड",
      "Analytics": "विश्लेषण",
      "Charts": "चार्ट",
      "User Profiles": "वापरकर्ता प्रोफाइल",
      "All User Profiles": "सर्व वापरकर्ता प्रोफाइल",
      "Memberships": "सदस्यत्वे",
      "Membership": "सदस्यत्व",
      "Membership Requests": "सदस्यत्व विनंत्या",
      "Interests": "आवडी",
      "Received Interests": "प्राप्त आवडी",
      "Voice Requests": "व्हॉइस विनंत्या",
      "Aadhaar Requests": "आधार विनंत्या",
      "Face Verification": "चेहरा पडताळणी",
      "Aadhaar Verification": "आधार पडताळणी",
      "User Reports": "वापरकर्ता अहवाल",
      "Contact Messages": "संपर्क संदेश",
      "Success Stories": "यशोगाथा",
      "Broadcast": "प्रसारण",
      "Website Home": "वेबसाइट मुख्यपृष्ठ",
      "Website": "वेबसाइट",
      "Home": "मुख्यपृष्ठ",
      "Register": "नोंदणी",
      "Login": "लॉगिन",
      "Logout": "लॉगआउट",
      "Admin Logout": "ॲडमिन लॉगआउट",
      "Profile": "प्रोफाइल",
      "My Profile": "माझे प्रोफाइल",
      "Profile Information": "प्रोफाइल माहिती",
      "Profile Details": "प्रोफाइल तपशील",
      "Search Profiles": "प्रोफाइल शोधा",
      "Search Profile Filters": "प्रोफाइल शोध फिल्टर",
      "Contact": "संपर्क",
      "Contact Us": "आमच्याशी संपर्क",
      "Privacy Policy": "गोपनीयता धोरण",
      "Terms & Conditions": "नियम आणि अटी",

      "Pending": "प्रलंबित",
      "Accepted": "स्वीकारले",
      "Rejected": "नाकारले",
      "Approved": "मंजूर",
      "Verified": "पडताळलेले",
      "Blocked": "ब्लॉक",
      "Active": "सक्रिय",
      "Offline": "ऑफलाइन",
      "Online": "ऑनलाइन",
      "Free": "मोफत",
      "All": "सर्व",
      "Total": "एकूण",
      "Refresh": "रिफ्रेश",
      "Resolved": "निकाली काढले",

      "Total Users": "एकूण वापरकर्ते",
      "Total Profiles": "एकूण प्रोफाइल",
      "Approved Profiles": "मंजूर प्रोफाइल",
      "Blocked Profiles": "ब्लॉक प्रोफाइल",
      "Total Interests": "एकूण आवडी",
      "Pending Reports": "प्रलंबित अहवाल",
      "Total Reports": "एकूण अहवाल",
      "Verified Users": "पडताळलेले वापरकर्ते",
      "Premium Members": "प्रीमियम सदस्य",
      "Pending Membership": "प्रलंबित सदस्यत्व",
      "Blocked Users": "ब्लॉक वापरकर्ते",
      "Registered Today": "आज नोंदणी",
      "Registered This Month": "या महिन्यात नोंदणी",
      "Total Messages": "एकूण संदेश",

      "Monthly Registrations": "मासिक नोंदणी",
      "Gender Distribution": "लिंग वितरण",
      "Membership Distribution": "सदस्यत्व वितरण",
      "Profile Verification Status": "प्रोफाइल पडताळणी स्थिती",
      "State-wise Users": "राज्यानुसार वापरकर्ते",
      "Disability-wise Users": "दिव्यांगतेनुसार वापरकर्ते",

      "Age": "वय",
      "Gender": "लिंग",
      "State": "राज्य",
      "District": "जिल्हा",
      "Education": "शिक्षण",
      "Occupation": "व्यवसाय",
      "Religion": "धर्म",
      "Income": "उत्पन्न",
      "Disability": "दिव्यांगता",
      "Disability Type": "दिव्यांगता प्रकार",
      "Marital Status": "वैवाहिक स्थिती",
      "About Me": "माझ्याबद्दल",
      "Personal Information": "वैयक्तिक माहिती",
      "Partner Preference": "जोडीदार प्राधान्य",

      "Male": "पुरुष",
      "Female": "महिला",
      "Other": "इतर",
      "Select Gender": "लिंग निवडा",
      "Select Marital Status": "वैवाहिक स्थिती निवडा",
      "Never Married": "अविवाहित",
      "Divorced": "घटस्फोटित",
      "Widowed": "विधवा/विधुर",
      "Minimum Age": "किमान वय",
      "Maximum Age": "कमाल वय",
      "Reset Filters": "फिल्टर रीसेट करा",

      "Send Interest": "आवड पाठवा",
      "Start Chat": "चॅट सुरू करा",
      "View Profile": "प्रोफाइल पहा",
      "Add to Favourite": "आवडत्यात जोडा",
      "Download Profile PDF": "प्रोफाइल PDF डाउनलोड करा",
      "Report User": "वापरकर्त्याचा अहवाल द्या",
      "Block User": "वापरकर्त्याला ब्लॉक करा",

      "Recommended Matches": "सुचवलेले जोडीदार",
      "Best Matches for You": "तुमच्यासाठी सर्वोत्तम जोडीदार",
      "Update Preferences": "प्राधान्ये अपडेट करा",

      "Your Notifications": "तुमच्या सूचना",
      "Unread Notifications": "न वाचलेल्या सूचना",
      "Notification Centre": "सूचना केंद्र",
      "Admin Notifications": "ॲडमिन सूचना",
      "Mark All as Read": "सर्व वाचले म्हणून चिन्हांकित करा",
      "Mark all read": "सर्व वाचले म्हणून चिन्हांकित करा",
      "No Notifications": "कोणतीही सूचना नाही",

      "Membership Plans": "सदस्यत्व योजना",
      "Current Plan": "सध्याची योजना",
      "Select Your Plan": "तुमची योजना निवडा",
      "Choose Silver": "सिल्वर निवडा",
      "Choose Gold": "गोल्ड निवडा",
      "Choose Platinum": "प्लॅटिनम निवडा",
      "Membership Payment": "सदस्यत्व पेमेंट",
      "Selected Membership": "निवडलेले सदस्यत्व",
      "Plan": "योजना",
      "Amount": "रक्कम",
      "Scan and Pay": "स्कॅन करून पेमेंट करा",
      "Submit Payment Details": "पेमेंट तपशील पाठवा",
      "UTR / Transaction Number": "UTR / व्यवहार क्रमांक",
      "Submit Membership Request": "सदस्यत्व विनंती पाठवा",
      "Admin Approval": "ॲडमिन मंजुरी",

      "Profile Photo": "प्रोफाइल फोटो",
      "Choose File": "फाइल निवडा",
      "Camera": "कॅमेरा",
      "30 Sec Intro Video": "30 सेकंद परिचय व्हिडिओ",
      "Record Video": "व्हिडिओ रेकॉर्ड करा",
      "Upload Video": "व्हिडिओ अपलोड करा",
      "Save Intro Video": "परिचय व्हिडिओ जतन करा",
      "Voice Intro": "व्हॉइस परिचय",
      "Aadhaar Front": "आधार पुढील बाजू",
      "Aadhaar Back": "आधार मागील बाजू",
      "Upload Selfie": "सेल्फी अपलोड करा",
      "Status": "स्थिती",
      "Not Uploaded": "अपलोड केलेले नाही",

      "Admin Login": "ॲडमिन लॉगिन",
      "Admin Email": "ॲडमिन ईमेल",
      "Admin Password": "ॲडमिन पासवर्ड",
      "Login as Admin": "ॲडमिन म्हणून लॉगिन करा",
      "Email Address": "ईमेल पत्ता",
      "Password": "पासवर्ड",
      "Remember Me": "मला लक्षात ठेवा",
      "Forgot Password?": "पासवर्ड विसरलात?",
      "Create New Account": "नवीन खाते तयार करा",

      "Find Your Perfect Life Partner": "तुमचा योग्य जीवनसाथी शोधा",
      "Register Free": "मोफत नोंदणी करा",
      "Verified Profiles": "पडताळलेले प्रोफाइल",
      "Secure Platform": "सुरक्षित प्लॅटफॉर्म",
      "Inclusive Community": "समावेशक समुदाय",
      "Total Members": "एकूण सदस्य",
      "Create Account": "खाते तयार करा",
      "Complete Profile": "प्रोफाइल पूर्ण करा",
      "Search & Connect": "शोधा आणि जोडा",

      "Submit Success Story": "यशोगाथा पाठवा",
      "Partner Name": "जोडीदाराचे नाव",
      "Story Title": "कथेचे शीर्षक",
      "Marriage Date": "लग्नाची तारीख",
      "City": "शहर",
      "Couple Photo": "जोडप्याचा फोटो",
      "Your Success Story": "तुमची यशोगाथा",

      "Dark": "डार्क",
      "Light": "लाइट",
      "Send": "पाठवा",
      "Report": "अहवाल",
      "Messages": "संदेश",
      "Favourites": "आवडते",
      "Profile Views": "प्रोफाइल दृश्ये",
      "Together Beyond Limits": "मर्यादांपलीकडे एकत्र",
      "Professional Matrimony Platform for the Divyang Community.": "दिव्यांग समुदायासाठी व्यावसायिक विवाह मंच.",
      "Quick Links": "द्रुत दुवे",
      "Support": "सहाय्य",
      "Full Name": "पूर्ण नाव",
      "Mobile Number": "मोबाइल क्रमांक",
      "Get Support": "मदत घ्या",
      "Stay Safe": "सुरक्षित रहा",
      "Today": "आज",
      "Profile Status": "प्रोफाइल स्थिती",
      "Incomplete": "अपूर्ण",
      "Free Member": "मोफत सदस्य",
      "Verification": "पडताळणी",
      "Profile Completion": "प्रोफाइल पूर्णता",
      "Complete Your Matrimony Profile": "तुमचे विवाह प्रोफाइल पूर्ण करा",
      "A complete profile receives better responses and suitable matches.": "पूर्ण प्रोफाइलमुळे चांगले प्रतिसाद आणि योग्य जुळणी मिळतात.",
      "Find suitable matches": "योग्य जुळणी शोधा",
      "Check premium status": "प्रीमियम स्थिती तपासा",
      "Edit Profile": "प्रोफाइल संपादित करा",
      "Update your details": "तुमचे तपशील अपडेट करा",
      "Contact DivyangSathi": "DivyangSathi शी संपर्क करा",
      "Who Viewed My Profile": "माझे प्रोफाइल कोणी पाहिले",
      "Unique Viewers": "वेगळे दर्शक",
      "Loading profile visitors...": "प्रोफाइल दर्शक लोड होत आहेत...",
      "Keep your information complete, correct and updated.": "तुमची माहिती पूर्ण, अचूक आणि अद्ययावत ठेवा.",
      "Premium Member": "प्रीमियम सदस्य",
      "Upload a clear profile photo. On mobile you can choose a file or use the camera.": "स्वच्छ प्रोफाइल फोटो अपलोड करा. मोबाइलवर फाइल निवडा किंवा कॅमेरा वापरा.",
      "Choose Profile Photo": "प्रोफाइल फोटो निवडा",
      "JPG, PNG or WEBP": "JPG, PNG किंवा WEBP",
      "Record a short introduction with your camera or upload an existing video.": "कॅमेऱ्याने छोटा परिचय रेकॉर्ड करा किंवा विद्यमान व्हिडिओ अपलोड करा.",
      "Upload Intro Video": "परिचय व्हिडिओ अपलोड करा",
      "Recommended: up to 30 seconds": "शिफारस: जास्तीत जास्त 30 सेकंद",
      "Upload clear Front and Back Aadhaar images for verification.": "पडताळणीसाठी आधारच्या पुढील आणि मागील बाजूच्या स्पष्ट प्रतिमा अपलोड करा.",
      "Upload a clear selfie for identity verification.": "ओळख पडताळणीसाठी स्पष्ट सेल्फी अपलोड करा.",
      "30 Second Voice Intro": "30 सेकंद व्हॉइस परिचय",
      "Record": "रेकॉर्ड करा",
      "Stop": "थांबा",
      "Play": "प्ले करा",
      "Upload": "अपलोड करा",
      "Delete": "हटवा",
      "No voice recorded.": "व्हॉइस रेकॉर्ड केलेला नाही.",
      "Gallery Photos": "गॅलरी फोटो",
      "Add additional photos to make your profile more attractive.": "प्रोफाइल अधिक आकर्षक करण्यासाठी अतिरिक्त फोटो जोडा.",
      "Add Gallery Photos": "गॅलरी फोटो जोडा",
      "Basic Information": "मूलभूत माहिती",
      "Enter your basic account and identity details.": "तुमच्या खात्याची आणि ओळखीची मूलभूत माहिती भरा.",
      "Provide accurate personal and disability-related information.": "अचूक वैयक्तिक आणि दिव्यांगता-संबंधित माहिती द्या.",
      "Date of Birth": "जन्मतारीख",
      "Disability Percentage": "दिव्यांगता टक्केवारी",
      "Caste": "जात",
      "Select": "निवडा",
      "Height": "उंची",
      "Weight": "वजन",
      "Education & Career": "शिक्षण आणि करिअर",
      "Add your educational and professional details.": "तुमचे शैक्षणिक आणि व्यावसायिक तपशील जोडा.",
      "Annual Income": "वार्षिक उत्पन्न",
      "Location": "स्थान",
      "Enter your current residential location.": "तुमचे सध्याचे राहण्याचे ठिकाण भरा.",
      "Introduce yourself in a respectful and meaningful way.": "स्वतःची आदरपूर्वक आणि अर्थपूर्ण ओळख करून द्या.",
      "About Yourself": "तुमच्याबद्दल",
      "Describe the qualities you are looking for in a life partner.": "जीवनसाथीमध्ये अपेक्षित गुणांचे वर्णन करा.",
      "Preferred Age": "प्राधान्य वय",
      "Preferred State": "प्राधान्य राज्य",
      "Preferred Disability": "प्राधान्य दिव्यांगता",
      "Additional Partner Preference": "अतिरिक्त जोडीदार प्राधान्य",
      "Save Profile": "प्रोफाइल जतन करा",
      "Deactivate Account": "खाते निष्क्रिय करा",
      "Request Account Deletion": "खाते हटवण्याची विनंती करा",
      "Login securely to complete your profile, search compatible matches and manage your membership.": "प्रोफाइल पूर्ण करण्यासाठी, योग्य जुळणी शोधण्यासाठी आणि सदस्यत्व व्यवस्थापित करण्यासाठी सुरक्षितपणे लॉगिन करा.",
      "Enter your registered email address and password": "तुमचा नोंदणीकृत ईमेल पत्ता आणि पासवर्ड भरा",
      "Before Sending Your Message": "संदेश पाठवण्यापूर्वी",
      "Clear Details": "स्पष्ट तपशील",
      "Correct Contact Details": "योग्य संपर्क तपशील",
      "Response Time": "प्रतिसाद वेळ",
      "Your Message": "तुमचा संदेश",
      "Subject": "विषय",
      "Send Message": "संदेश पाठवा",
    }
  };

  // -------------------------------------------------------
  // ORIGINAL VALUE STORAGE
  // WeakMap use kiya hai, dataset nahi.
  // Isliye aria-label wala error nahi aayega.
  // -------------------------------------------------------

  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();

  let currentLanguage =
  localStorage.getItem("divyangsathi-language") ||
  localStorage.getItem("divyangsathi_language") ||
  localStorage.getItem("language") ||
  "en";

  // -------------------------------------------------------
  // SAFE TEXT TRANSLATION
  // -------------------------------------------------------

  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function translateString(value, language) {
    const text = cleanText(value);

    if (!text || language === "en") {
      return value;
    }

    const dictionary = translations[language] || {};

    if (dictionary[text]) {
      return dictionary[text];
    }

    return value;
  }

  // -------------------------------------------------------
  // TEXT NODE TRANSLATION
  // -------------------------------------------------------

  function translateTextNode(node, language) {
    if (!node || node.nodeType !== Node.TEXT_NODE) {
      return;
    }

    const parent = node.parentElement;

    if (!parent) {
      return;
    }

    if (
      parent.matches(
        "script, style, textarea, code, pre, option[data-no-translate]"
      )
    ) {
      return;
    }

    if (
      parent.closest(
        "[data-no-translate], .no-translate"
      )
    ) {
      return;
    }

    if (!originalText.has(node)) {
      originalText.set(node, node.nodeValue);
    }

    const original = originalText.get(node);

    if (language === "en") {
      node.nodeValue = original;
      return;
    }

    const trimmed = cleanText(original);

    if (!trimmed) {
      return;
    }

    const translated =
      translateString(trimmed, language);

    if (translated === trimmed) {
      return;
    }

    const leading =
      original.match(/^\s*/)?.[0] || "";

    const trailing =
      original.match(/\s*$/)?.[0] || "";

    node.nodeValue =
      leading + translated + trailing;
  }

  // -------------------------------------------------------
  // ATTRIBUTE TRANSLATION
  // -------------------------------------------------------

  const translatableAttributes = [
    "placeholder",
    "title",
    "aria-label"
  ];

  function getOriginalAttributeMap(element) {
    if (!originalAttributes.has(element)) {
      originalAttributes.set(element, {});
    }

    return originalAttributes.get(element);
  }

  function translateAttributes(element, language) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    if (
      element.closest(
        "[data-no-translate], .no-translate"
      )
    ) {
      return;
    }

    const originals =
      getOriginalAttributeMap(element);

    translatableAttributes.forEach(
      function (attributeName) {

        if (!element.hasAttribute(attributeName)) {
          return;
        }

        if (
          !Object.prototype.hasOwnProperty.call(
            originals,
            attributeName
          )
        ) {
          originals[attributeName] =
            element.getAttribute(attributeName);
        }

        const original =
          originals[attributeName];

        if (language === "en") {
          element.setAttribute(
            attributeName,
            original
          );
          return;
        }

        element.setAttribute(
          attributeName,
          translateString(
            original,
            language
          )
        );
      }
    );
  }

  // -------------------------------------------------------
  // SELECT OPTION TRANSLATION
  // -------------------------------------------------------

  function translateOption(option, language) {
    if (!option) {
      return;
    }

    if (!originalText.has(option)) {
      originalText.set(
        option,
        option.textContent
      );
    }

    const original =
      originalText.get(option);

    if (language === "en") {
      option.textContent = original;
      return;
    }

    option.textContent =
      translateString(
        original,
        language
      );
  }

  // -------------------------------------------------------
  // TRANSLATE COMPLETE PAGE
  // -------------------------------------------------------

  function translatePage(language) {
    if (!["en", "hi", "mr"].includes(language)) {
      language = "en";
    }

    currentLanguage = language;

    localStorage.setItem(
      "divyangsathi_language",
      language
    );
    localStorage.setItem(
  "divyangsathi-language",
  language
);

    localStorage.setItem(
      "language",
      language
    );

    document.documentElement.lang =
      language === "hi"
        ? "hi"
        : language === "mr"
          ? "mr"
          : "en";

    // Attributes
    document
      .querySelectorAll("*")
      .forEach(function (element) {
        translateAttributes(
          element,
          language
        );
      });

    // Options
    document
      .querySelectorAll("option")
      .forEach(function (option) {
        translateOption(
          option,
          language
        );
      });

    // Text Nodes
    const walker =
      document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function (node) {
            const parent =
              node.parentElement;

            if (!parent) {
              return NodeFilter.FILTER_REJECT;
            }

            if (
              parent.matches(
                "script, style, textarea, code, pre"
              )
            ) {
              return NodeFilter.FILTER_REJECT;
            }

            if (
              parent.closest(
                "[data-no-translate], .no-translate"
              )
            ) {
              return NodeFilter.FILTER_REJECT;
            }

            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

    let node;

    while ((node = walker.nextNode())) {
      translateTextNode(
        node,
        language
      );
    }

    syncLanguageSelectors(language);
  }

  // -------------------------------------------------------
  // LANGUAGE SELECTORS
  // -------------------------------------------------------

  function syncLanguageSelectors(language) {
    const selectors = [
      document.getElementById(
        "adminLanguageSelector"
      ),
      document.getElementById(
        "languageSelector"
      ),
      document.getElementById(
        "userLanguageSelector"
      ),
      document.getElementById(
        "commonLanguageSelector"
      )
    ].filter(Boolean);

    document
      .querySelectorAll(
        'select[data-language-selector], select.language-selector'
      )
      .forEach(function (select) {
        selectors.push(select);
      });

    [...new Set(selectors)]
      .forEach(function (selector) {

        if (
          selector.querySelector(
            `option[value="${language}"]`
          )
        ) {
          selector.value = language;
        }

        if (
          selector.dataset
            .dsLanguageConnected === "true"
        ) {
          return;
        }

        selector.dataset
          .dsLanguageConnected = "true";

        selector.addEventListener(
          "change",
          function () {
            translatePage(
              selector.value
            );
          }
        );
      });
  }

  // -------------------------------------------------------
  // DYNAMIC CONTENT
  // Supabase / JS se baad me aane wale UI ko bhi translate.
  // -------------------------------------------------------

  let observerTimer = null;

  const observer =
    new MutationObserver(function (mutations) {

      if (currentLanguage === "en") {
        return;
      }

      const hasAddedContent =
        mutations.some(function (mutation) {
          return (
            mutation.addedNodes &&
            mutation.addedNodes.length > 0
          );
        });

      if (!hasAddedContent) {
        return;
      }

      clearTimeout(observerTimer);

      observerTimer =
        setTimeout(function () {
          translatePage(
            currentLanguage
          );
        }, 120);
    });

  // -------------------------------------------------------
  // INIT
  // -------------------------------------------------------

  function initFullPageTranslation() {
    syncLanguageSelectors(
      currentLanguage
    );

    translatePage(
      currentLanguage
    );

    if (document.body) {
      observer.observe(
        document.body,
        {
          childList: true,
          subtree: true
        }
      );
    }
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initFullPageTranslation
    );
  } else {
    initFullPageTranslation();
  }

  document.addEventListener(
    "divyangsathi:layout-ready",
    function () {
      setTimeout(function () {
        syncLanguageSelectors(
          currentLanguage
        );

        translatePage(
          currentLanguage
        );
      }, 50);
    }
  );

  // Global function
  window.setDivyangSathiLanguage =
    function (language) {
      translatePage(language);
    };

})();