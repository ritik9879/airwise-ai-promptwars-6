export type Language = 'en' | 'hi';
import type { Recommendation } from './domain/recommendations';

export function localizedRecommendation(recommendation: Recommendation, aqi: number | null | undefined, language: Language): Recommendation {
  if (language === 'en') return recommendation;
  const value = aqi == null || !Number.isFinite(aqi) ? null : Math.round(aqi);
  if (value == null) return { ...recommendation, title: 'सामान्य सावधानी सूची अपनाएँ', action: 'लाइव वायु गुणवत्ता डेटा उपलब्ध नहीं है। इसे साफ हवा का संकेत न मानें; तेज़ बाहरी गतिविधि से पहले स्थानीय स्रोत देखें।', why: 'चुने गए स्थान के लिए कोई मान्य वर्तमान AQI उपलब्ध नहीं है।', rule: 'डेटा न होने पर AirWise प्रदूषण का स्तर नहीं मानता।', benefit: 'गलत भरोसे से बचते हुए अगला व्यावहारिक कदम देता है।', uncertainty: 'स्थानीय स्थिति अलग हो सकती है; कोई वर्तमान माप उपलब्ध नहीं है।' };
  if (value <= 50) return { ...recommendation, title: 'बाहरी गतिविधियाँ सामान्य रूप से ठीक हैं', action: 'सामान्य बाहरी गतिविधि उचित हो सकती है। यदि कोई व्यक्ति विशेष रूप से संवेदनशील है तो स्थानीय स्थिति देखते रहें।', why: `दिया गया U.S. AQI ${value} (${value <= 50 ? 'अच्छा' : ''}) है।`, rule: 'U.S. AQI 0–50: अच्छा।', benefit: 'सामान्य दिनचर्या जारी रखते हुए जानकारी बनाए रखता है।', uncertainty: 'यह बाहर की मॉडल-आधारित जानकारी है, घर के अंदर का सेंसर माप या चिकित्सकीय आकलन नहीं।' };
  if (value <= 100) return { ...recommendation, title: 'तेज़ गतिविधि को लचीला रखें', action: 'बच्चों, वरिष्ठों या अतिरिक्त सावधानी चुनने वाले लोगों के लिए लंबी या तेज़ बाहरी कसरत कम करने पर विचार करें।', why: `दिया गया U.S. AQI ${value} (मध्यम) है।`, rule: 'U.S. AQI 51–100: मध्यम।', benefit: 'रोज़मर्रा की गतिविधि को बनाए रखते हुए लंबे और तेज़ संपर्क को घटाने में मदद।', uncertainty: 'संवेदनशीलता अलग-अलग होती है; यह सामान्य मार्गदर्शन है, चिकित्सा सलाह नहीं।' };
  if (value <= 150) return { ...recommendation, title: 'तेज़ गतिविधि घर के अंदर करें', action: 'बच्चों, वरिष्ठों या अतिरिक्त सावधानी चाहने वाले सदस्यों के लिए घर के अंदर की गतिविधि चुनें। बाहर समय कम और हल्का रखें।', why: `दिया गया U.S. AQI ${value} (संवेदनशील समूहों के लिए अस्वस्थ) है।`, rule: 'U.S. AQI 101–150: संवेदनशील समूहों के लिए अस्वस्थ।', benefit: 'AQI श्रेणी से प्रभावित समूहों की अधिक संपर्क वाली गतिविधि घटती है।', uncertainty: 'यह मॉडल-आधारित बाहरी डेटा है; AirWise स्वास्थ्य स्थिति या घर की हवा नहीं जानता।' };
  if (value <= 200) return { ...recommendation, title: 'बाहरी तेज़ गतिविधि कम करें', action: 'लंबी या कठिन बाहरी गतिविधि घटाएँ। बाहर जाना ज़रूरी हो तो समय कम रखें और जहाँ संभव हो कम यातायात वाला रास्ता चुनें।', why: `दिया गया U.S. AQI ${value} (अस्वस्थ) है।`, rule: 'U.S. AQI 151–200: अस्वस्थ।', benefit: 'तेज़ सांस लेने वाली गतिविधियों के दौरान संपर्क कम करता है।', uncertainty: 'रास्ते की प्रदूषण मात्रा और घर के अंदर की हवा मापी नहीं गई है।' };
  return { ...recommendation, title: 'बाहरी गतिविधि न्यूनतम रखें', action: 'बाहर बिताया समय यथासंभव कम करें और व्यायाम या खेल घर के अंदर करें। गंभीर स्थिति में स्थानीय जन-स्वास्थ्य निर्देश देखें।', why: `दिया गया U.S. AQI ${value} (${value <= 300 ? 'बहुत अस्वस्थ' : 'खतरनाक'}) है।`, rule: value <= 300 ? 'U.S. AQI 201–300: बहुत अस्वस्थ।' : 'U.S. AQI 301+: खतरनाक।', benefit: 'बहुत अधिक मॉडल-आधारित प्रदूषण के दौरान बाहर का समय कम करता है।', uncertainty: 'यह सामान्य पर्यावरणीय मार्गदर्शन है; व्यक्तिगत सलाह के लिए स्थानीय स्वास्थ्य सेवा से संपर्क करें।' };
}

export const copy = {
  en: {
    nav: { dashboard: 'Overview', planner: 'Daily planner', indoor: 'Indoor air', mobility: 'Eco mobility', impact: 'Impact calculator', family: 'Family mode', community: 'Community', assistant: 'AI assistant', settings: 'Data & settings' },
    status: { live: 'Live model data', recent: 'Recently updated', stale: 'Stale data', unavailable: 'Data unavailable', demo: 'Demonstration sample' },
    search: 'Search a city or place', searchButton: 'Search', locate: 'Use my location', source: 'Source', loading: 'Loading air-quality data…', tryDemo: 'View labeled demo data', noData: 'No live reading is available. AirWise will not substitute a made-up value.',
  },
  hi: {
    nav: { dashboard: 'डैशबोर्ड', planner: 'दैनिक योजना', indoor: 'घर की हवा', mobility: 'पर्यावरण-अनुकूल यात्रा', impact: 'प्रभाव कैलकुलेटर', family: 'परिवार मोड', community: 'समुदाय', assistant: 'AI सहायक', settings: 'डेटा और सेटिंग्स' },
    status: { live: 'लाइव मॉडल डेटा', recent: 'हाल में अपडेट', stale: 'पुराना डेटा', unavailable: 'डेटा उपलब्ध नहीं', demo: 'डेमो नमूना' },
    search: 'शहर या स्थान खोजें', searchButton: 'खोजें', locate: 'मेरी लोकेशन उपयोग करें', source: 'स्रोत', loading: 'वायु गुणवत्ता डेटा लोड हो रहा है…', tryDemo: 'स्पष्ट डेमो डेटा देखें', noData: 'लाइव रीडिंग उपलब्ध नहीं है। AirWise कोई मनगढ़ंत मान नहीं दिखाएगा।',
  },
} as const;
