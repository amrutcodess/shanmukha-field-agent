import { Language } from '../types';

const translationsData = {
  te: {
    // Brand & App
    appName: 'షణ్ముఖ',
    appFullName: 'షణ్ముఖ రైతు సేవ',
    tagline: 'రైతుకు నమ్మకమైన తోడు',
    poweredBy: 'షణ్ముఖ అగ్రిటెక్ ఆధ్వర్యంలో',
    inPartnershipWith: 'సహకారంతో:',

    // Common Actions & Labels
    continue: 'కొనసాగించండి',
    submit: 'పంపండి',
    start: 'ప్రారంభించండి',
    back: 'వెనక్కి',
    cancel: 'వద్దు',
    yesAgree: 'సరే, అంగీకరిస్తున్నాను',
    noCancel: 'వద్దు, ఆపండి',
    done: 'పూర్తయింది',
    sent: 'పంపబడింది',
    success: 'విజయవంతం',
    loading: 'దయచేసి వేచి ఉండండి...',
    viewReport: 'నా రిపోర్టు చూడండి',
    downloadPdf: 'రిపోర్టు డౌన్‌లోడ్ (PDF)',
    listenAdvice: 'సలహా వినండి',
    speaking: 'వినిపిస్తోంది...',
    stopListening: 'ఆపండి',
    newBadge: 'కొత్తది',
    viewAll: 'అన్నీ చూడండి',
    close: 'మూసివేయి',
    readMore: 'పూర్తిగా చదవండి',
    markRead: 'చదివాను',
    withdrawConsent: 'రద్దు చేయండి',
    consentActive: 'అనుమతి ఉంది',
    consentWithdrawn: 'రద్దు చేయబడింది',

    // Nav Bar
    navHome: 'హోమ్',
    navReports: 'రిపోర్టులు',
    navAlerts: 'హెచ్చరికలు',
    navHelp: 'సహాయం',

    // Login & OTP
    loginTitle: 'రైతు లాగిన్',
    loginSubtitle: 'మీ మొబైల్ నంబర్ ఇవ్వండి',
    mobilePlaceholder: '10 అంకెల మొబైల్ నంబర్',
    enterOtpTitle: 'ఓటీపీ నమోదు చేయండి',
    enterOtpSubtitle: 'మీ మొబైల్‌కు వచ్చిన 4 అంకెల కోడ్ ఇవ్వండి',
    otpHint: 'డెమో ఓటీపీ: 1234',
    verifyAndLogin: 'లాగిన్ అవ్వండి',
    changeNumber: 'నంబర్ మార్చండి',
    invalidMobile: 'సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి',
    invalidOtp: 'ఓటీపీ తప్పుగా ఉంది. 1234 నమోదు చేయండి',
    unregisteredNumberPrompt: 'ఈ నంబర్ ఇంకా నమోదు కాలేదు. కొత్త ఖాతా తెరవండి!',
    startSignUp: 'కొత్త రైతు ఖాతా తెరవండి',
    haveAccount: 'ఇప్పటికే ఖాతా ఉందా? లాగిన్ అవ్వండి',

    // Guided Onboarding / Sign-up Flow
    onboardingStepLanguage: 'మీ భాషను ఎంచుకోండి',
    onboardingStepLanguageSub: 'Choose your preferred language',
    onboardingStepPhone: 'మొబైల్ నంబర్',
    onboardingStepPhoneSub: 'ఓటీపీ వెరిఫికేషన్ కోసం నంబర్ ఇవ్వండి',
    onboardingStepProfile: 'మీ పేరు & ఫోటో',
    onboardingStepProfileSub: 'మీ వివరాలను ఇక్కడ రాయండి',
    farmerNameLabel: 'రైతు పూర్తి పేరు',
    namePlaceholder: 'ఉదా: రమేష్ రెడ్డి',
    photoOptional: 'ప్రొఫైల్ ఫోటో (ఐచ్ఛికం)',
    takePhoto: 'ఫోటో తీయండి',
    uploadPhoto: 'గ్యాలరీ నుండి ఎంచుకోండి',
    
    // Geotag Screen
    onboardingStepLocation: 'పొలం ఉన్న ప్రదేశం (జియోట్యాగ్)',
    onboardingStepLocationSub: 'ఖచ్చితమైన వాతావరణం మరియు మట్టి సలహా కొరకు',
    useMyLocation: 'నా పొలం లొకేషన్ గుర్తించండి',
    detectingLocation: 'లొకేషన్ గుర్తిస్తోంది...',
    locationDetected: 'లొకేషన్ విజయవంతంగా గుర్తించబడింది!',
    dragPinHint: 'పిన్‌ను జరిపి మీ పొలం ఖచ్చితమైన స్థానాన్ని సరిచూడండి',
    accuracyLabel: 'ఖచ్చితత్వం (Accuracy)',
    meters: 'మీటర్లు',
    manualLocationToggle: 'లొకేషన్ రాలేదా? వివరాలు స్వయంగా రాయండి',
    stateLabel: 'రాష్ట్రం',
    districtLabel: 'జిల్లా',
    mandalLabel: 'మండలం',
    villageNameLabel: 'గ్రామం పేరు',
    locationDeniedMsg: 'లొకేషన్ అనుమతి లభించలేదు. క్రింద గ్రామం వివరాలను నమోదు చేయండి.',

    // Farm Details Screen
    onboardingStepFarm: 'వ్యవసాయ వివరాలు',
    onboardingStepFarmSub: 'మీ పంట మరియు పొలం కొలతలు',
    cropSelectionLabel: 'ప్రధాన పంటను ఎంచుకోండి',
    paddy: 'వరి',
    cotton: 'పత్తి',
    chilli: 'మిరప',
    maize: 'మొక్కజొన్న',
    groundnut: 'వేరుశనగ',
    banana: 'అరటి',
    otherCrop: 'ఇతర పంట',
    acresStepperLabel: 'పొలం విస్తీర్ణం (ఎకరాలు)',
    irrigationLabel: 'నీటి పారుదల వనరు',
    borewell: 'బోరు బావి',
    canal: 'కాలువ / చెరువు',
    rainfed: 'వర్షాధారం',
    seasonLabel: 'ప్రస్తుత పంట కాలం',
    kharif: 'ఖరీఫ్ (వానాకాలం)',
    rabi: 'రబీ (యాసంగి)',
    summer: 'వేసవి',

    // Review & Celebration
    onboardingStepReview: 'వివరాలు సరిచూడండి',
    onboardingStepReviewSub: 'ఖాతా సృష్టించడానికి సిద్ధం',
    createMyAccount: 'నా ఖాతా సృష్టించండి',
    accountCreatedSuccess: 'అభినందనలు! మీ ఖాతా సిద్ధమైంది',
    welcomeToShanmukha: 'షణ్ముఖ రైతు సేవలకు స్వాగతం!',
    goToHome: 'హోమ్ పేజీకి వెళ్లండి',
    geotagCapturedBadge: 'లొకేషన్ గుర్తించబడింది',
    geotagMissingBadge: 'లొకేషన్ లేదు',
    farmLocationCardTitle: 'పొలం స్థానం (జియోట్యాగ్)',

    // Home Screen
    greeting: 'నమస్తే',
    garu: 'గారు',
    farmCardTitle: 'మీ వ్యవసాయ వివరాలు',
    villageLabel: 'గ్రామం',
    cropLabel: 'పంట',
    acresLabel: 'విస్తీర్ణం',
    acresUnit: 'ఎకరాలు',
    servicesTitle: 'వ్యవసాయ సేవలు',
    servicesSubtitle: 'మీకు కావలసిన సేవను ఎంచుకోండి',

    // Vendors & Services
    fylloName: 'ఫైల్లో (Fyllo)',
    fylloShortDesc: 'నేల తేమ, వాతావరణం మరియు పంట సలహా',
    fylloLine1: 'మీ పొలంలో అమర్చిన సెన్సార్ల ద్వారా నేల తేమను తెలుసుకోండి.',
    fylloLine2: 'వర్ష సూచన మరియు నీటి తడుల వివరాలు ఎప్పటికప్పుడు పొందండి.',

    kshemaName: 'క్షేమ (Kshema)',
    kshemaShortDesc: 'నమ్మకమైన సులభ పంట బీమా',
    kshemaLine1: 'మీ పంటకు ప్రకృతి విపత్తుల నుండి పూర్తి రక్షణ కల్పించండి.',
    kshemaLine2: 'సులభమైన దరఖాస్తుతో వేగంగా క్లెయిమ్ పరిహారం పొందండి.',

    samunnatiName: 'సమున్నతి (Samunnati)',
    samunnatiShortDesc: 'పంట రుణాలు & మంచి ధరకు విక్రయం',
    samunnatiLine1: 'ఎరువులు, విత్తనాల కోసం తక్కువ వడ్డీతో సులభంగా రుణం పొందండి.',
    samunnatiLine2: 'మీ పంటను సరైన మద్దతు ధరకు మార్కెట్లో అమ్ముకోండి.',

    biotaName: 'బయోటా (BioTa)',
    biotaShortDesc: 'భూసార పరీక్ష & ఖచ్చితమైన ఎరువుల నివేదిక',
    biotaLine1: 'మీ నేల సారం, పోషకాల స్థాయిని ప్రయోగశాలలో పరీక్షించండి.',
    biotaLine2: 'ఏ ఎరువు ఎంత మోతాదులో వాడాలో స్పష్టమైన రిపోర్టు పొందండి.',

    // Consent Screen
    consentTitle: 'అనుమతి ఇవ్వండి',
    consentNoticePrefix: 'ఈ సేవను మీకు అందించడానికి, మీ',
    consentDetailsList: 'పేరు, ఫోన్ నంబర్, గ్రామం మరియు పంట వివరాలు',
    consentNoticeSuffix: 'ను భాగస్వామి సంస్థతో పంచుకుంటాము.',
    consentSafeGuarantee: 'మీ సమాచారం షణ్ముఖ వద్ద సురక్షితంగా ఉంటుంది. ఎప్పుడైనా అనుమతిని రద్దు చేసుకోవచ్చు.',

    // Progress Screen
    progressTitle: 'మీ అభ్యర్థన పూర్తవుతోంది',
    progressStep1: 'అభ్యర్థన పంపబడింది',
    progressStep2: 'భాగస్వామి సమాచారం సిద్ధం చేస్తోంది',
    progressStep3: 'రిపోర్టు సిద్ధమైంది!',
    progressCompletedMsg: 'మీ నివేదిక విజయవంతంగా షణ్ముఖ యాప్‌లో సిద్ధమైంది.',

    // Reports Screen
    reportsTitle: 'నా రిపోర్టులు',
    noReports: 'ఇంకా ఎలాంటి రిపోర్టులు లేవు.',
    reportSummaryLabel: 'ముఖ్య వివరాలు',
    keyValuesTitle: 'క్షేత్ర ఫలితాలు & కొలతలు',
    adviceTitle: 'రైతుకు వ్యవసాయ సలహా',
    statusGood: 'మంచిది',
    statusWarning: 'గమనించండి',
    statusCritical: 'జాగ్రత్త',
    pdfDownloadedToast: 'రిపోర్టు విజయవంతంగా డౌన్‌లోడ్ అయింది!',

    // Alerts Screen
    alertsTitle: 'హెచ్చరికలు & సమాచారం',
    noAlerts: 'ప్రస్తుతం కొత్త హెచ్చరికలు ఏవీ లేవు.',
    unreadAlertsCount: 'కొత్త సందేశాలు',

    // Help Screen
    helpTitle: 'రైతు సహాయ కేంద్రం',
    helpSubtitle: 'మేము మీకు సహాయం చేయడానికి ఎల్లప్పుడూ సిద్ధంగా ఉన్నాము',
    callUsTitle: 'మాతో మాట్లాడండి',
    callUsSubtitle: 'ఉచిత టోల్ ఫ్రీ నంబర్',
    tollFreeNumber: '1800-123-4567',
    tapToCall: 'కాల్ చేయండి',
    askVisitTitle: 'ఫీల్డ్ ఆఫీసర్ రమ్మని అడగండి',
    askVisitSubtitle: 'మా వ్యవసాయ నిపుణుడు మీ పొలానికి వస్తారు',
    fieldMessagePlaceholder: 'మీ సమస్య లేదా అవసరం ఏమిటో ఇక్కడ రాయండి... (ఉదా: ఆకుపై మచ్చలు ఉన్నాయి)',
    sendVisitRequest: 'అభ్యర్థన పంపండి',
    visitSentSuccess: 'మీ అభ్యర్థన నమోదైంది! మా ఫీల్డ్ ఆఫీసర్ త్వరలో వస్తారు.',

    // Profile Screen
    profileTitle: 'రైతు ప్రొఫైల్',
    phoneLabel: 'మొబైల్ నంబర్',
    givenConsentsTitle: 'మీరు ఇచ్చిన అనుమతులు',
    noConsents: 'ప్రస్తుతం ఏ సేవలకూ అనుమతులు ఇవ్వలేదు.',
    logoutBtn: 'లాగౌట్ అవ్వండి',
    switchLang: 'భాష మార్చుకోండి',

    // Demo Helpers
    demoBarTitle: 'డెమో సాధనాలు',
    resetDataBtn: 'డెమో డేటా రీసెట్',
    simulateAlertBtn: 'కొత్త హెచ్చరికను పంపండి',
    openAdminBtn: 'అడ్మిన్ ప్యానెల్',
    openFarmerBtn: 'రైతు యాప్',
    demoAlertSimulatedToast: 'రైతు ఫోన్‌కు కొత్త హెచ్చరిక పంపబడింది!',
    demoResetToast: 'డెమో సమాచారం రీసెట్ చేయబడింది!'
  },

  en: {
    // Brand & App
    appName: 'Shanmukha',
    appFullName: 'Shanmukha Farmer App',
    tagline: 'Trusted Partner for Every Farmer',
    poweredBy: 'Powered by Shanmukha Agritech',
    inPartnershipWith: 'In partnership with:',

    // Common Actions & Labels
    continue: 'Continue',
    submit: 'Submit',
    start: 'Start',
    back: 'Back',
    cancel: 'Cancel',
    yesAgree: 'Yes, I agree',
    noCancel: 'No, cancel',
    done: 'Done',
    sent: 'Sent',
    success: 'Success',
    loading: 'Please wait...',
    viewReport: 'View my report',
    downloadPdf: 'Download Report (PDF)',
    listenAdvice: 'Listen to Advice',
    speaking: 'Reading aloud...',
    stopListening: 'Stop',
    newBadge: 'New',
    viewAll: 'View All',
    close: 'Close',
    readMore: 'Read Full',
    markRead: 'Mark as read',
    withdrawConsent: 'Withdraw',
    consentActive: 'Active',
    consentWithdrawn: 'Withdrawn',

    // Nav Bar
    navHome: 'Home',
    navReports: 'Reports',
    navAlerts: 'Alerts',
    navHelp: 'Help',

    // Login & OTP
    loginTitle: 'Farmer Login',
    loginSubtitle: 'Enter your mobile number',
    mobilePlaceholder: '10-digit mobile number',
    enterOtpTitle: 'Enter 4-Digit OTP',
    enterOtpSubtitle: 'Enter the code sent to your phone',
    otpHint: 'Demo OTP: 1234',
    verifyAndLogin: 'Verify & Login',
    changeNumber: 'Change number',
    invalidMobile: 'Please enter a valid 10-digit phone number',
    invalidOtp: 'Invalid OTP. Please enter 1234',
    unregisteredNumberPrompt: 'Phone number not registered yet. Open an account in 1 minute!',
    startSignUp: 'Create New Farmer Account',
    haveAccount: 'Already have an account? Sign In',

    // Guided Onboarding / Sign-up Flow
    onboardingStepLanguage: 'Select Your Language',
    onboardingStepLanguageSub: 'Choose your preferred language',
    onboardingStepPhone: 'Mobile Number',
    onboardingStepPhoneSub: 'Enter your mobile number for OTP',
    onboardingStepProfile: 'Your Name & Photo',
    onboardingStepProfileSub: 'Introduce yourself to Shanmukha',
    farmerNameLabel: 'Farmer Full Name',
    namePlaceholder: 'e.g. Ramesh Reddy',
    photoOptional: 'Profile Photo (Optional)',
    takePhoto: 'Take Photo',
    uploadPhoto: 'Choose from Gallery',

    // Geotag Screen
    onboardingStepLocation: 'Farm Location (Geotag)',
    onboardingStepLocationSub: 'For pin-point micro-climate and soil advisory',
    useMyLocation: 'Use My Current Location',
    detectingLocation: 'Detecting GPS coordinates...',
    locationDetected: 'Location detected successfully!',
    dragPinHint: 'Drag the pin to adjust your farm boundary',
    accuracyLabel: 'Accuracy',
    meters: 'meters',
    manualLocationToggle: 'GPS unavailable? Enter village manually',
    stateLabel: 'State',
    districtLabel: 'District',
    mandalLabel: 'Mandal',
    villageNameLabel: 'Village Name',
    locationDeniedMsg: 'GPS location denied or unavailable. Please enter village details below.',

    // Farm Details Screen
    onboardingStepFarm: 'Farm Specifics',
    onboardingStepFarmSub: 'Crop and land measurement',
    cropSelectionLabel: 'Select Primary Crop',
    paddy: 'Paddy (Rice)',
    cotton: 'Cotton',
    chilli: 'Chilli',
    maize: 'Maize',
    groundnut: 'Groundnut',
    banana: 'Banana',
    otherCrop: 'Other Crop',
    acresStepperLabel: 'Land Size (Acres)',
    irrigationLabel: 'Irrigation Source',
    borewell: 'Borewell',
    canal: 'Canal / Pond',
    rainfed: 'Rain-fed',
    seasonLabel: 'Current Season',
    kharif: 'Kharif (Monsoon)',
    rabi: 'Rabi (Winter)',
    summer: 'Summer',

    // Review & Celebration
    onboardingStepReview: 'Review & Confirm',
    onboardingStepReviewSub: 'Ready to create your farmer digital ID',
    createMyAccount: 'Create My Account',
    accountCreatedSuccess: 'Congratulations! Your Account Is Ready',
    welcomeToShanmukha: 'Welcome to Shanmukha Agritech!',
    goToHome: 'Go to Home Dashboard',
    geotagCapturedBadge: 'Geotag Captured',
    geotagMissingBadge: 'Geotag Missing',
    farmLocationCardTitle: 'Farm Location (Geotag)',

    // Home Screen
    greeting: 'Namaste',
    garu: '',
    farmCardTitle: 'My Farm Details',
    villageLabel: 'Village',
    cropLabel: 'Crop',
    acresLabel: 'Area',
    acresUnit: 'Acres',
    servicesTitle: 'Partner Services',
    servicesSubtitle: 'Select a service for your crop',

    // Vendors & Services
    fylloName: 'Fyllo',
    fylloShortDesc: 'Soil & weather sensors, crop advice',
    fylloLine1: 'Real-time soil moisture and micro-climate data from farm IoT sensors.',
    fylloLine2: 'Accurate rain forecast and precise irrigation recommendations.',

    kshemaName: 'Kshema',
    kshemaShortDesc: 'Reliable crop insurance protection',
    kshemaLine1: 'Complete protection against drought, pest damage, and unseasonal rainfall.',
    kshemaLine2: 'Hassle-free digital enrollment and fast claim settlements directly.',

    samunnatiName: 'Samunnati',
    samunnatiShortDesc: 'Easy crop loans & market selling',
    samunnatiLine1: 'Low-interest working capital loans for seeds, fertilizers, and inputs.',
    samunnatiLine2: 'Sell your harvest directly at fair, transparent market prices.',

    biotaName: 'BioTa',
    biotaShortDesc: 'Soil health reports & fertilizer advice',
    biotaLine1: 'Comprehensive lab testing for soil nutrients, pH, and organic matter.',
    biotaLine2: 'Personalized fertilizer advisory to cut costs and maximize yield.',

    // Consent Screen
    consentTitle: 'Give Consent',
    consentNoticePrefix: 'To give you this service, we will share these details with',
    consentDetailsList: 'your name, phone number, village, crop',
    consentNoticeSuffix: '.',
    consentSafeGuarantee: 'Your data is strictly secured with Shanmukha. You can withdraw anytime.',

    // Progress Screen
    progressTitle: 'Preparing Your Service',
    progressStep1: 'Request sent',
    progressStep2: 'Partner is preparing',
    progressStep3: 'Report ready!',
    progressCompletedMsg: 'Your report has arrived inside Shanmukha app.',

    // Reports Screen
    reportsTitle: 'My Reports',
    noReports: 'No reports yet.',
    reportSummaryLabel: 'Summary',
    keyValuesTitle: 'Field Metrics & Measurements',
    adviceTitle: 'Agronomist Advice',
    statusGood: 'Good',
    statusWarning: 'Attention',
    statusCritical: 'Critical',
    pdfDownloadedToast: 'Report downloaded successfully!',

    // Alerts Screen
    alertsTitle: 'Alerts & Notices',
    noAlerts: 'No alerts right now.',
    unreadAlertsCount: 'unread alerts',

    // Help Screen
    helpTitle: 'Farmer Help Desk',
    helpSubtitle: 'We are always here to support your farming needs',
    callUsTitle: 'Call Our Agronomist',
    callUsSubtitle: 'Toll-free customer care',
    tollFreeNumber: '1800-123-4567',
    tapToCall: 'Tap to Call',
    askVisitTitle: 'Ask for a Field Visit',
    askVisitSubtitle: 'Our agricultural expert will visit your field',
    fieldMessagePlaceholder: 'Describe your farm issue here... (e.g. leaf spots observed on paddy)',
    sendVisitRequest: 'Request Visit',
    visitSentSuccess: 'Field visit requested! Our officer will contact you shortly.',

    // Profile Screen
    profileTitle: 'Farmer Profile',
    phoneLabel: 'Mobile Number',
    givenConsentsTitle: 'Consents Given',
    noConsents: 'No active partner consents yet.',
    logoutBtn: 'Logout',
    switchLang: 'Switch Language',

    // Demo Helpers
    demoBarTitle: 'Demo Controls',
    resetDataBtn: 'Reset Demo Data',
    simulateAlertBtn: 'Simulate Partner Alert',
    openAdminBtn: 'Admin Panel',
    openFarmerBtn: 'Farmer App',
    demoAlertSimulatedToast: 'Simulated alert sent to farmer phone!',
    demoResetToast: 'Demo data has been reset to defaults!'
  }
};

export const translations: Record<Language, typeof translationsData.te> = translationsData;

export function getTranslation(lang: Language) {
  return translations[lang] || translations.te;
}
