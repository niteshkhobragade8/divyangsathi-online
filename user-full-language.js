// ==========================================================
// DIVYANGSATHI USER FULL PAGE LANGUAGE
// English / Hindi / Marathi
// USER PAGES ONLY — ADMIN IS NOT TOUCHED
// ==========================================================

(function () {
  "use strict";

  // Admin pages par kuch nahi karna
  const currentFile =
    location.pathname.split("/").pop() || "index.html";

  if (
    currentFile.toLowerCase().startsWith("admin") ||
    document.body.classList.contains("admin-body")
  ) {
    return;
  }

  const STORAGE_KEY = "divyangsathi-user-language";

  // ==========================================================
  // HINDI
  // ==========================================================

  const hindi = {

    "Home": "होम",
    "Register": "पंजीकरण",
    "Login": "लॉगिन",
    "Logout": "लॉग आउट",

    "Profile": "प्रोफ़ाइल",
    "My Profile": "मेरी प्रोफ़ाइल",
    "Profile Information": "प्रोफ़ाइल जानकारी",
    "Profile Details": "प्रोफ़ाइल विवरण",
    "Personal Information": "व्यक्तिगत जानकारी",

    "Search": "खोजें",
    "Search Profiles": "प्रोफ़ाइल खोजें",
    "Search Matches": "रिश्ते खोजें",

    "Membership": "सदस्यता",
    "Membership Plans": "सदस्यता योजनाएँ",

    "Success Stories": "सफलता की कहानियाँ",

    "Contact": "संपर्क",
    "Contact Us": "हमसे संपर्क करें",

    "Privacy": "गोपनीयता",
    "Privacy Policy": "गोपनीयता नीति",

    "Terms": "शर्तें",
    "Terms & Conditions": "नियम और शर्तें",

    "About": "हमारे बारे में",

    "Find Your Perfect Life Partner":
      "अपना सही जीवनसाथी खोजें",

    "Register Free":
      "मुफ़्त पंजीकरण करें",

    "Verified Profiles":
      "सत्यापित प्रोफ़ाइल",

    "Secure Platform":
      "सुरक्षित प्लेटफ़ॉर्म",

    "Inclusive Community":
      "समावेशी समुदाय",

    "Total Members":
      "कुल सदस्य",

    "Happy Connections":
      "सफल जुड़ाव",

    "India-Focused Platform":
      "भारत-केंद्रित प्लेटफ़ॉर्म",

    "Inclusive Matrimony":
      "समावेशी विवाह मंच",

    "Safe & Secure":
      "सुरक्षित",

    "Smart Search":
      "स्मार्ट खोज",

    "Affordable Plans":
      "किफ़ायती योजनाएँ",

    "Create Account":
      "खाता बनाएँ",

    "Complete Profile":
      "प्रोफ़ाइल पूरी करें",

    "Search & Connect":
      "खोजें और जुड़ें",

    "Get Support":
      "सहायता लें",

    "Contact Support":
      "सहायता से संपर्क करें",

    "Welcome Back to DivyangSathi":
      "DivyangSathi में वापस स्वागत है",

    "Login to Your Account":
      "अपने खाते में लॉगिन करें",

    "Email Address":
      "ईमेल पता",

    "Password":
      "पासवर्ड",

    "Remember Me":
      "मुझे याद रखें",

    "Forgot Password?":
      "पासवर्ड भूल गए?",

    "Create New Account":
      "नया खाता बनाएँ",

    "Full Name":
      "पूरा नाम",

    "Mobile Number":
      "मोबाइल नंबर",

    "Gender":
      "लिंग",

    "Male":
      "पुरुष",

    "Female":
      "महिला",

    "Other":
      "अन्य",

    "Age":
      "आयु",

    "Date of Birth":
      "जन्म तिथि",

    "State":
      "राज्य",

    "District":
      "जिला",

    "City":
      "शहर",

    "Religion":
      "धर्म",

    "Education":
      "शिक्षा",

    "Occupation":
      "व्यवसाय",

    "Income":
      "आय",

    "Marital Status":
      "वैवाहिक स्थिति",

    "Never Married":
      "अविवाहित",

    "Divorced":
      "तलाकशुदा",

    "Widowed":
      "विधवा/विधुर",

    "Disability":
      "दिव्यांगता",

    "Disability Type":
      "दिव्यांगता प्रकार",

    "About Me":
      "मेरे बारे में",

    "Partner Preference":
      "जीवनसाथी की पसंद",

    "Profile Photo":
      "प्रोफ़ाइल फोटो",

    "Choose Profile Photo":
      "प्रोफ़ाइल फोटो चुनें",

    "Choose File":
      "फ़ाइल चुनें",

    "Camera":
      "कैमरा",

    "30 Sec Intro Video":
      "30 सेकंड परिचय वीडियो",

    "30 sec intro video":
      "30 सेकंड परिचय वीडियो",

    "Record Video":
      "वीडियो रिकॉर्ड करें",

    "Upload Video":
      "वीडियो अपलोड करें",

    "Upload Intro Video":
      "परिचय वीडियो अपलोड करें",

    "Save Intro Video":
      "परिचय वीडियो सहेजें",

    "Aadhaar Verification":
      "आधार सत्यापन",

    "Aadhaar Front":
      "आधार आगे का भाग",

    "Aadhaar Back":
      "आधार पीछे का भाग",

    "Face Verification":
      "चेहरा सत्यापन",

    "Upload Selfie":
      "सेल्फ़ी अपलोड करें",

    "Status":
      "स्थिति",

    "Not Uploaded":
      "अपलोड नहीं हुआ",

    "Save Profile":
      "प्रोफ़ाइल सहेजें",

    "Deactivate Account":
      "खाता निष्क्रिय करें",

    "Request Account Deletion":
      "खाता हटाने का अनुरोध करें",

    "Voice Intro":
      "वॉइस परिचय",

    "Send Interest":
      "रुचि भेजें",

    "Start Chat":
      "चैट शुरू करें",

    "Add to Favourite":
      "पसंदीदा में जोड़ें",

    "Download Profile PDF":
      "प्रोफ़ाइल PDF डाउनलोड करें",

    "Report User":
      "उपयोगकर्ता की रिपोर्ट करें",

    "Block User":
      "उपयोगकर्ता को ब्लॉक करें",

    "Stay Safe":
      "सुरक्षित रहें",

    "View Profile":
      "प्रोफ़ाइल देखें",

    "Received Interests":
      "प्राप्त रुचियाँ",

    "Manage Requests":
      "अनुरोध प्रबंधित करें",

    "Check Profile":
      "प्रोफ़ाइल देखें",

    "Accept Carefully":
      "सावधानी से स्वीकार करें",

    "Reject Respectfully":
      "सम्मानपूर्वक अस्वीकार करें",

    "Pending":
      "लंबित",

    "Accepted":
      "स्वीकृत",

    "Rejected":
      "अस्वीकृत",

    "Accept":
      "स्वीकार करें",

    "Reject":
      "अस्वीकार करें",

    "Search Profile Filters":
      "प्रोफ़ाइल खोज फ़िल्टर",

    "Select Gender":
      "लिंग चुनें",

    "Minimum Age":
      "न्यूनतम आयु",

    "Maximum Age":
      "अधिकतम आयु",

    "Select Marital Status":
      "वैवाहिक स्थिति चुनें",

    "Reset Filters":
      "फ़िल्टर रीसेट करें",

    "Recommended Matches":
      "सुझाए गए रिश्ते",

    "Best Matches for You":
      "आपके लिए सर्वोत्तम रिश्ते",

    "Update Preferences":
      "पसंद अपडेट करें",

    "Your Notifications":
      "आपकी सूचनाएँ",

    "Unread Notifications":
      "अपठित सूचनाएँ",

    "Notification Centre":
      "सूचना केंद्र",

    "Mark All as Read":
      "सभी को पढ़ा हुआ करें",

    "Mark all read":
      "सभी को पढ़ा हुआ करें",

    "Current Plan":
      "वर्तमान योजना",

    "Select Your Plan":
      "अपनी योजना चुनें",

    "Basic Account":
      "बेसिक खाता",

    "Starter Membership":
      "स्टार्टर सदस्यता",

    "Premium Membership":
      "प्रीमियम सदस्यता",

    "Ultimate Membership":
      "अल्टीमेट सदस्यता",

    "Choose Silver":
      "सिल्वर चुनें",

    "Choose Gold":
      "गोल्ड चुनें",

    "Choose Platinum":
      "प्लैटिनम चुनें",

    "Membership Payment":
      "सदस्यता भुगतान",

    "Selected Membership":
      "चुनी गई सदस्यता",

    "Plan":
      "योजना",

    "Amount":
      "राशि",

    "Scan and Pay":
      "स्कैन करके भुगतान करें",

    "Submit Payment Details":
      "भुगतान विवरण भेजें",

    "UTR / Transaction Number":
      "UTR / लेनदेन नंबर",

    "Submit Membership Request":
      "सदस्यता अनुरोध भेजें",

    "Important Information":
      "महत्वपूर्ण जानकारी",

    "IMPORTANT INFORMATION":
      "महत्वपूर्ण जानकारी",

    "Correct Payment":
      "सही भुगतान",

    "Valid UTR Number":
      "मान्य UTR नंबर",

    "Admin Approval":
      "एडमिन स्वीकृति",

    "Non-Refundable":
      "गैर-वापसी योग्य",

    "Submit Success Story":
      "सफलता की कहानी भेजें",

    "Partner Name":
      "जीवनसाथी का नाम",

    "Story Title":
      "कहानी का शीर्षक",

    "Marriage Date":
      "विवाह की तारीख",

    "Couple Photo":
      "जोड़े की फोटो",

    "Your Success Story":
      "आपकी सफलता की कहानी",

    "Private Chat":
      "निजी चैट",

    "Your Chats":
      "आपकी चैट",

    "Select a conversation":
      "बातचीत चुनें",

    "Select a Conversation":
      "बातचीत चुनें",

    "Report":
      "रिपोर्ट",

    "Replying to message":
      "संदेश का उत्तर",

    "Send":
      "भेजें",

    "Private & Secure":
      "निजी और सुरक्षित",

    "Respect Everyone":
      "सभी का सम्मान करें",

    "Send Message":
      "संदेश भेजें",

    "Your Message":
      "आपका संदेश",

    "Subject":
      "विषय",

    "Before Sending Your Message":
      "अपना संदेश भेजने से पहले",

    "Clear Details":
      "स्पष्ट विवरण",

    "Correct Contact Details":
      "सही संपर्क विवरण",

    "Response Time":
      "उत्तर का समय",

    "Quick Links":
      "त्वरित लिंक",

    "Support":
      "सहायता",

    "Free":
      "मुफ़्त",

    "Verified":
      "सत्यापित",

    "Active":
      "सक्रिय",

    "Offline":
      "ऑफ़लाइन",

    "Loading...":
      "लोड हो रहा है...",

    "No notifications.":
      "कोई सूचना नहीं।",

    "Professional Matrimony Platform for Divyang Community":
      "दिव्यांग समुदाय के लिए पेशेवर विवाह मंच",

    "Professional Matrimony Platform for the Divyang Community.":
      "दिव्यांग समुदाय के लिए पेशेवर विवाह मंच।",

    "All Rights Reserved.":
      "सर्वाधिकार सुरक्षित।"
  };


  // ==========================================================
  // MARATHI
  // ==========================================================

  const marathi = {

    "Home":"मुख्यपृष्ठ",
    "Register":"नोंदणी",
    "Login":"लॉगिन",
    "Logout":"लॉगआउट",

    "Profile":"प्रोफाइल",
    "My Profile":"माझे प्रोफाइल",
    "Profile Information":"प्रोफाइल माहिती",
    "Profile Details":"प्रोफाइल तपशील",
    "Personal Information":"वैयक्तिक माहिती",

    "Search":"शोधा",
    "Search Profiles":"प्रोफाइल शोधा",
    "Search Matches":"जोडीदार शोधा",

    "Membership":"सदस्यत्व",
    "Membership Plans":"सदस्यत्व योजना",

    "Success Stories":"यशोगाथा",

    "Contact":"संपर्क",
    "Contact Us":"आमच्याशी संपर्क करा",

    "Privacy":"गोपनीयता",
    "Privacy Policy":"गोपनीयता धोरण",

    "Terms":"अटी",
    "Terms & Conditions":"अटी व शर्ती",

    "About":"आमच्याबद्दल",

    "Find Your Perfect Life Partner":
      "तुमचा योग्य जीवनसाथी शोधा",

    "Register Free":
      "मोफत नोंदणी करा",

    "Verified Profiles":
      "पडताळलेले प्रोफाइल",

    "Secure Platform":
      "सुरक्षित प्लॅटफॉर्म",

    "Inclusive Community":
      "समावेशक समुदाय",

    "Total Members":
      "एकूण सदस्य",

    "Happy Connections":
      "आनंदी जोडण्या",

    "India-Focused Platform":
      "भारत-केंद्रित प्लॅटफॉर्म",

    "Inclusive Matrimony":
      "समावेशक विवाह मंच",

    "Safe & Secure":
      "सुरक्षित",

    "Smart Search":
      "स्मार्ट शोध",

    "Affordable Plans":
      "परवडणाऱ्या योजना",

    "Create Account":
      "खाते तयार करा",

    "Complete Profile":
      "प्रोफाइल पूर्ण करा",

    "Search & Connect":
      "शोधा आणि जोडा",

    "Get Support":
      "मदत घ्या",

    "Contact Support":
      "सहाय्याशी संपर्क करा",

    "Welcome Back to DivyangSathi":
      "DivyangSathi मध्ये पुन्हा स्वागत आहे",

    "Login to Your Account":
      "तुमच्या खात्यात लॉगिन करा",

    "Email Address":
      "ईमेल पत्ता",

    "Password":
      "पासवर्ड",

    "Remember Me":
      "मला लक्षात ठेवा",

    "Forgot Password?":
      "पासवर्ड विसरलात?",

    "Create New Account":
      "नवीन खाते तयार करा",

    "Full Name":
      "पूर्ण नाव",

    "Mobile Number":
      "मोबाइल क्रमांक",

    "Gender":
      "लिंग",

    "Male":
      "पुरुष",

    "Female":
      "महिला",

    "Other":
      "इतर",

    "Age":
      "वय",

    "Date of Birth":
      "जन्मतारीख",

    "State":
      "राज्य",

    "District":
      "जिल्हा",

    "City":
      "शहर",

    "Religion":
      "धर्म",

    "Education":
      "शिक्षण",

    "Occupation":
      "व्यवसाय",

    "Income":
      "उत्पन्न",

    "Marital Status":
      "वैवाहिक स्थिती",

    "Never Married":
      "अविवाहित",

    "Divorced":
      "घटस्फोटित",

    "Widowed":
      "विधवा/विधुर",

    "Disability":
      "दिव्यांगता",

    "Disability Type":
      "दिव्यांगता प्रकार",

    "About Me":
      "माझ्याबद्दल",

    "Partner Preference":
      "जोडीदार प्राधान्य",

    "Profile Photo":
      "प्रोफाइल फोटो",

    "Choose Profile Photo":
      "प्रोफाइल फोटो निवडा",

    "Choose File":
      "फाइल निवडा",

    "Camera":
      "कॅमेरा",

    "30 Sec Intro Video":
      "30 सेकंद परिचय व्हिडिओ",

    "30 sec intro video":
      "30 सेकंद परिचय व्हिडिओ",

    "Record Video":
      "व्हिडिओ रेकॉर्ड करा",

    "Upload Video":
      "व्हिडिओ अपलोड करा",

    "Upload Intro Video":
      "परिचय व्हिडिओ अपलोड करा",

    "Save Intro Video":
      "परिचय व्हिडिओ जतन करा",

    "Aadhaar Verification":
      "आधार पडताळणी",

    "Aadhaar Front":
      "आधार पुढील बाजू",

    "Aadhaar Back":
      "आधार मागील बाजू",

    "Face Verification":
      "चेहरा पडताळणी",

    "Upload Selfie":
      "सेल्फी अपलोड करा",

    "Status":
      "स्थिती",

    "Not Uploaded":
      "अपलोड केलेले नाही",

    "Save Profile":
      "प्रोफाइल जतन करा",

    "Deactivate Account":
      "खाते निष्क्रिय करा",

    "Request Account Deletion":
      "खाते हटवण्याची विनंती करा",

    "Voice Intro":
      "व्हॉइस परिचय",

    "Send Interest":
      "आवड पाठवा",

    "Start Chat":
      "चॅट सुरू करा",

    "Add to Favourite":
      "आवडत्यात जोडा",

    "Download Profile PDF":
      "प्रोफाइल PDF डाउनलोड करा",

    "Report User":
      "वापरकर्त्याचा अहवाल द्या",

    "Block User":
      "वापरकर्त्याला ब्लॉक करा",

    "Stay Safe":
      "सुरक्षित रहा",

    "View Profile":
      "प्रोफाइल पहा",

    "Received Interests":
      "प्राप्त आवडी",

    "Manage Requests":
      "विनंत्या व्यवस्थापित करा",

    "Check Profile":
      "प्रोफाइल पहा",

    "Accept Carefully":
      "काळजीपूर्वक स्वीकारा",

    "Reject Respectfully":
      "आदराने नकार द्या",

    "Pending":
      "प्रलंबित",

    "Accepted":
      "स्वीकारले",

    "Rejected":
      "नाकारले",

    "Accept":
      "स्वीकारा",

    "Reject":
      "नाकारा",

    "Search Profile Filters":
      "प्रोफाइल शोध फिल्टर",

    "Select Gender":
      "लिंग निवडा",

    "Minimum Age":
      "किमान वय",

    "Maximum Age":
      "कमाल वय",

    "Select Marital Status":
      "वैवाहिक स्थिती निवडा",

    "Reset Filters":
      "फिल्टर रीसेट करा",

    "Recommended Matches":
      "सुचवलेले जोडीदार",

    "Best Matches for You":
      "तुमच्यासाठी सर्वोत्तम जोडीदार",

    "Update Preferences":
      "प्राधान्ये अपडेट करा",

    "Your Notifications":
      "तुमच्या सूचना",

    "Unread Notifications":
      "न वाचलेल्या सूचना",

    "Notification Centre":
      "सूचना केंद्र",

    "Mark All as Read":
      "सर्व वाचले म्हणून चिन्हांकित करा",

    "Current Plan":
      "सध्याची योजना",

    "Select Your Plan":
      "तुमची योजना निवडा",

    "Basic Account":
      "मूलभूत खाते",

    "Starter Membership":
      "स्टार्टर सदस्यत्व",

    "Premium Membership":
      "प्रीमियम सदस्यत्व",

    "Ultimate Membership":
      "अल्टिमेट सदस्यत्व",

    "Choose Silver":
      "सिल्वर निवडा",

    "Choose Gold":
      "गोल्ड निवडा",

    "Choose Platinum":
      "प्लॅटिनम निवडा",

    "Membership Payment":
      "सदस्यत्व पेमेंट",

    "Selected Membership":
      "निवडलेले सदस्यत्व",

    "Plan":
      "योजना",

    "Amount":
      "रक्कम",

    "Scan and Pay":
      "स्कॅन करून पेमेंट करा",

    "Submit Payment Details":
      "पेमेंट तपशील पाठवा",

    "UTR / Transaction Number":
      "UTR / व्यवहार क्रमांक",

    "Submit Membership Request":
      "सदस्यत्व विनंती पाठवा",

    "Important Information":
      "महत्त्वाची माहिती",

    "IMPORTANT INFORMATION":
      "महत्त्वाची माहिती",

    "Correct Payment":
      "योग्य पेमेंट",

    "Valid UTR Number":
      "वैध UTR क्रमांक",

    "Admin Approval":
      "ॲडमिन मंजुरी",

    "Non-Refundable":
      "परतावा नाही",

    "Submit Success Story":
      "यशोगाथा पाठवा",

    "Partner Name":
      "जोडीदाराचे नाव",

    "Story Title":
      "कथेचे शीर्षक",

    "Marriage Date":
      "लग्नाची तारीख",

    "Couple Photo":
      "जोडप्याचा फोटो",

    "Your Success Story":
      "तुमची यशोगाथा",

    "Private Chat":
      "खाजगी चॅट",

    "Your Chats":
      "तुमच्या चॅट्स",

    "Select a conversation":
      "संभाषण निवडा",

    "Select a Conversation":
      "संभाषण निवडा",

    "Report":
      "अहवाल",

    "Replying to message":
      "संदेशाला उत्तर",

    "Send":
      "पाठवा",

    "Private & Secure":
      "खाजगी आणि सुरक्षित",

    "Respect Everyone":
      "सर्वांचा आदर करा",

    "Send Message":
      "संदेश पाठवा",

    "Your Message":
      "तुमचा संदेश",

    "Subject":
      "विषय",

    "Before Sending Your Message":
      "तुमचा संदेश पाठवण्यापूर्वी",

    "Clear Details":
      "स्पष्ट तपशील",

    "Correct Contact Details":
      "योग्य संपर्क तपशील",

    "Response Time":
      "प्रतिसाद वेळ",

    "Quick Links":
      "द्रुत दुवे",

    "Support":
      "सहाय्य",

    "Free":
      "मोफत",

    "Verified":
      "पडताळलेले",

    "Active":
      "सक्रिय",

    "Offline":
      "ऑफलाइन",

    "Loading...":
      "लोड होत आहे...",

    "No notifications.":
      "कोणतीही सूचना नाही।",

    "Professional Matrimony Platform for Divyang Community":
      "दिव्यांग समुदायासाठी व्यावसायिक विवाह मंच",

    "Professional Matrimony Platform for the Divyang Community.":
      "दिव्यांग समुदायासाठी व्यावसायिक विवाह मंच।",

    "All Rights Reserved.":
      "सर्व हक्क राखीव."
  };


  const dictionaries = {
    hi: hindi,
    mr: marathi
  };


  // Original English text store
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();

  let currentLanguage = "en";
  let translating = false;


  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }


  // User/database content ko protect karne ke liye
  function protectedElement(element) {

    if (!element || !element.closest) {
      return true;
    }

    return Boolean(
      element.closest(
        "script," +
        "style," +
        "noscript," +
        "code," +
        "pre," +
        "svg," +
        "canvas," +
        "[contenteditable='true']," +
        "[data-no-translate]," +
        "[data-i18n-ignore]," +
        ".notranslate"
      )
    );
  }


  function translateValue(original, language) {

    if (
      !original ||
      language === "en"
    ) {
      return original;
    }

    const dictionary =
      dictionaries[language];

    if (!dictionary) {
      return original;
    }

    const cleaned =
      cleanText(original);

    // Exact translation
    if (dictionary[cleaned]) {

      const startSpace =
        original.match(/^\s*/)?.[0] || "";

      const endSpace =
        original.match(/\s*$/)?.[0] || "";

      return (
        startSpace +
        dictionary[cleaned] +
        endSpace
      );
    }


    // Example:
    // Age: 25
    // becomes
    // आयु: 25
    //
    // Only known UI phrases are replaced.
    let result = original;

    Object
      .keys(dictionary)
      .sort(
        (a, b) =>
          b.length - a.length
      )
      .forEach(function (english) {

        if (english.length < 4) {
          return;
        }

        const safe =
          english.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );

        const regex =
          new RegExp(
            safe,
            "gi"
          );

        result =
          result.replace(
            regex,
            dictionary[english]
          );
      });

    return result;
  }


  function translateTextNode(
    node,
    language
  ) {

    if (
      !node ||
      node.nodeType !== Node.TEXT_NODE ||
      !node.parentElement ||
      protectedElement(node.parentElement)
    ) {
      return;
    }

    if (!originalText.has(node)) {
      originalText.set(
        node,
        node.nodeValue
      );
    }

    const original =
      originalText.get(node);

    const translated =
      translateValue(
        original,
        language
      );

    if (
      node.nodeValue !== translated
    ) {
      node.nodeValue =
        translated;
    }
  }


  function translateAttributes(
    element,
    language
  ) {

    if (
      !element ||
      element.nodeType !== Node.ELEMENT_NODE ||
      protectedElement(element)
    ) {
      return;
    }

    let saved =
      originalAttributes.get(
        element
      );

    if (!saved) {

      saved = {};

      originalAttributes.set(
        element,
        saved
      );
    }

    [
      "placeholder",
      "title",
      "aria-label"
    ].forEach(function (attribute) {

      if (
        !element.hasAttribute(
          attribute
        )
      ) {
        return;
      }

      if (
        !(attribute in saved)
      ) {
        saved[attribute] =
          element.getAttribute(
            attribute
          );
      }

      const original =
        saved[attribute];

      const translated =
        translateValue(
          original,
          language
        );

      if (
        element.getAttribute(
          attribute
        ) !== translated
      ) {
        element.setAttribute(
          attribute,
          translated
        );
      }
    });
  }


  function translatePage(
    language
  ) {

    if (!document.body) {
      return;
    }

    translating = true;

    const walker =
      document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT |
        NodeFilter.SHOW_TEXT
      );

    let node;

    while (
      (node = walker.nextNode())
    ) {

      if (
        node.nodeType ===
        Node.TEXT_NODE
      ) {
        translateTextNode(
          node,
          language
        );
      }

      else if (
        node.nodeType ===
        Node.ELEMENT_NODE
      ) {
        translateAttributes(
          node,
          language
        );
      }
    }

    translating = false;
  }


  // ==========================================================
  // LANGUAGE SELECTORS
  // ==========================================================

  function findLanguageSelectors() {

    return document.querySelectorAll(
      "#languageSelector," +
      "#userLanguageSelector," +
      "#languageSelect," +
      "select[name='language']," +
      "select[data-language-selector]," +
      ".language-selector"
    );
  }


  function selectorLanguage(
    selector
  ) {

    const value =
      String(
        selector.value || ""
      ).toLowerCase();

    const selectedText =
      cleanText(
        selector.options?.[
          selector.selectedIndex
        ]?.textContent || ""
      ).toLowerCase();


    if (
      value === "hi" ||
      value.startsWith("hi") ||
      selectedText.includes("hindi") ||
      selectedText.includes("हिंदी")
    ) {
      return "hi";
    }


    if (
      value === "mr" ||
      value.startsWith("mr") ||
      selectedText.includes("marathi") ||
      selectedText.includes("मराठी")
    ) {
      return "mr";
    }


    return "en";
  }


  function updateSelectors(
    language
  ) {

    findLanguageSelectors()
      .forEach(function (selector) {

        Array
          .from(selector.options || [])
          .some(function (option) {

            const value =
              String(
                option.value || ""
              ).toLowerCase();

            const text =
              cleanText(
                option.textContent
              ).toLowerCase();


            const matchEnglish =
              language === "en" &&
              (
                value === "en" ||
                value.startsWith("en") ||
                text === "english"
              );


            const matchHindi =
              language === "hi" &&
              (
                value === "hi" ||
                value.startsWith("hi") ||
                text.includes("hindi") ||
                text.includes("हिंदी")
              );


            const matchMarathi =
              language === "mr" &&
              (
                value === "mr" ||
                value.startsWith("mr") ||
                text.includes("marathi") ||
                text.includes("मराठी")
              );


            if (
              matchEnglish ||
              matchHindi ||
              matchMarathi
            ) {
              selector.value =
                option.value;

              return true;
            }

            return false;
          });


        if (
          selector.dataset
            .dsUserFullLanguage ===
          "1"
        ) {
          return;
        }


        selector.dataset
          .dsUserFullLanguage =
          "1";


        selector.addEventListener(
          "change",
          function () {

            const language =
              selectorLanguage(
                selector
              );

            setUserLanguage(
              language
            );
          }
        );

      });
  }


  // ==========================================================
  // MAIN LANGUAGE CHANGE
  // ==========================================================

  function setUserLanguage(
    language
  ) {

    if (
      !["en", "hi", "mr"]
        .includes(language)
    ) {
      language = "en";
    }

    currentLanguage =
      language;


    localStorage.setItem(
      STORAGE_KEY,
      language
    );


    // Existing old scripts compatibility
    localStorage.setItem(
      "language",
      language
    );

    localStorage.setItem(
      "selectedLanguage",
      language
    );

    localStorage.setItem(
      "divyangsathi-language",
      language
    );

    localStorage.setItem(
      "divyangsathi_language",
      language
    );


    document.documentElement.lang =
      language;


    translatePage(
      language
    );


    updateSelectors(
      language
    );


    window.dispatchEvent(
      new CustomEvent(
        "divyangsathi:user-language-changed",
        {
          detail: {
            language:
              language
          }
        }
      )
    );
  }


  // ==========================================================
  // LOAD SAVED LANGUAGE
  // ==========================================================

  function getSavedLanguage() {

    const saved = [

      localStorage.getItem(
        STORAGE_KEY
      ),

      localStorage.getItem(
        "divyangsathi-language"
      ),

      localStorage.getItem(
        "divyangsathi_language"
      ),

      localStorage.getItem(
        "selectedLanguage"
      ),

      localStorage.getItem(
        "language"
      )

    ].filter(Boolean);


    for (
      const value of saved
    ) {

      const language =
        String(value)
          .toLowerCase();


      if (
        language === "hi" ||
        language.startsWith("hi") ||
        language === "hindi"
      ) {
        return "hi";
      }


      if (
        language === "mr" ||
        language.startsWith("mr") ||
        language === "marathi"
      ) {
        return "mr";
      }


      if (
        language === "en" ||
        language.startsWith("en") ||
        language === "english"
      ) {
        return "en";
      }
    }


    return "en";
  }


  // ==========================================================
  // DYNAMIC CONTENT OBSERVER
  // Supabase se UI cards baad me load ho to unke labels bhi translate hon
  // ==========================================================

  const observer =
    new MutationObserver(
      function (mutations) {

        if (
          translating ||
          currentLanguage === "en"
        ) {
          return;
        }

        translating = true;

        mutations.forEach(
          function (mutation) {

            mutation.addedNodes
              .forEach(
                function (addedNode) {

                  if (
                    addedNode.nodeType ===
                    Node.TEXT_NODE
                  ) {
                    translateTextNode(
                      addedNode,
                      currentLanguage
                    );

                    return;
                  }


                  if (
                    addedNode.nodeType !==
                    Node.ELEMENT_NODE
                  ) {
                    return;
                  }


                  translateAttributes(
                    addedNode,
                    currentLanguage
                  );


                  const walker =
                    document.createTreeWalker(
                      addedNode,
                      NodeFilter.SHOW_ELEMENT |
                      NodeFilter.SHOW_TEXT
                    );


                  let child;


                  while (
                    (child =
                      walker.nextNode())
                  ) {

                    if (
                      child.nodeType ===
                      Node.TEXT_NODE
                    ) {
                      translateTextNode(
                        child,
                        currentLanguage
                      );
                    }

                    else {
                      translateAttributes(
                        child,
                        currentLanguage
                      );
                    }
                  }
                }
              );
          }
        );


        updateSelectors(
          currentLanguage
        );


        translating = false;
      }
    );


  // ==========================================================
  // INITIALIZE
  // ==========================================================

  function initUserLanguage() {

    // Double safety:
    // Admin ko bilkul touch nahi karna.
    const page =
      (
        location.pathname
          .split("/")
          .pop() ||
        "index.html"
      ).toLowerCase();


    if (
      page.startsWith("admin") ||
      document.body.classList.contains(
        "admin-body"
      )
    ) {
      return;
    }


    currentLanguage =
      getSavedLanguage();


    setUserLanguage(
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


    // Common header/footer baad me inject ho sakta hai
    setTimeout(
      function () {
        translatePage(
          currentLanguage
        );

        updateSelectors(
          currentLanguage
        );
      },
      300
    );


    setTimeout(
      function () {
        translatePage(
          currentLanguage
        );

        updateSelectors(
          currentLanguage
        );
      },
      1000
    );


    setTimeout(
      function () {
        translatePage(
          currentLanguage
        );

        updateSelectors(
          currentLanguage
        );
      },
      2000
    );
  }


  // Existing scripts bhi is function ko call kar sakte hain
  window.setDivyangSathiLanguage =
    setUserLanguage;

  window.setUserLanguage =
    setUserLanguage;


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initUserLanguage
    );

  } else {

    initUserLanguage();

  }


  // layout.js ke header/footer load hone ke baad
  document.addEventListener(
    "divyangsathi:layout-ready",
    function () {

      translatePage(
        currentLanguage
      );

      updateSelectors(
        currentLanguage
      );
    }
  );

})();

// ===== FIX: ENGLISH MUST RESTORE ORIGINAL PAGE =====
(function () {
  const STORAGE_KEY = "userLanguage";

  function getLanguage() {
    const selector = document.getElementById("languageSelector");
    return selector?.value || localStorage.getItem(STORAGE_KEY) || "en";
  }

  function fixEnglish() {
    const lang = getLanguage();

    // English selected hai to kisi translation function ko force mat karo
    if (lang === "en") {
      document.documentElement.lang = "en";
      return;
    }
  }

  document.addEventListener("DOMContentLoaded", fixEnglish);

  document.addEventListener("change", function (e) {
    if (
      e.target.id === "languageSelector" ||
      e.target.id === "userLanguageSelector"
    ) {
      const lang = e.target.value;

      localStorage.setItem(STORAGE_KEY, lang);

      // English par original HTML dobara load hoga
      if (lang === "en") {
        sessionStorage.setItem("forceEnglish", "1");
        location.reload();
      }
    }
  });

  // Marathi/Hindi translation ko English par chalne se roko
  if (localStorage.getItem(STORAGE_KEY) === "en") {
    document.documentElement.lang = "en";
  }
})();