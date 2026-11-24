# PromptTantu — आपका AI Prompt Library App

**Version 1.0** में कुल **100,050 numbered prompts** हैं: पुराने 100,000 (P50001–P150000) और नए 50 (P150001–P150050)।

## इसमें क्या कर सकते हैं?

- अपनी ज़रूरत का prompt ID, टॉपिक या slash mode डालकर खोजें।
- Photo Editing, Gemini, Research, Coding, Business और Productivity सहित 20 categories चुनें।
- किसी prompt पर क्लिक करके `[[]]` placeholders भरें और तैयार prompt कॉपी करें।
- Favorite prompts अपने ब्राउज़र में सेव करें।
- अपना नया prompt बनाएं या अगला weekly batch JSON/JSONL में import करें।
- Workflow Studio से ChatGPT + Gemini + NotebookLM के तैयार workflows कॉपी करें।
- App को browser में Add to Home Screen करके PWA की तरह इस्तेमाल करें।

## कंप्यूटर पर ऐप कैसे खोलें?

1. ZIP extract करें।
2. PromptTantu फ़ोल्डर में command prompt / terminal खोलें।
3. `python -m http.server 8000` चलाएं।
4. ब्राउज़र में `http://localhost:8000` खोलें।

केवल `index.html` पर double-click करना पर्याप्त नहीं है—डेटा लोड करने के लिए local server या GitHub Pages चाहिए।

## GitHub पर भेजना

1. GitHub के **dapperdude404** खाते में नया repository बनाएं: [github.com/new](https://github.com/new)।
2. उसका नाम **prompttantu** और visibility Public चुनें।
3. ZIP में मौजूद **PromptTantu फ़ोल्डर की सारी फ़ाइलें और folders** repository में upload करें।
4. Repo → Settings → Pages → Deploy from a branch → main / root चुनें।
5. Deploy सफल होने के बाद ऐप का संभावित पता होगा: `https://dapperdude404.github.io/prompttantu/`। जब तक deploy नहीं होता, यह लिंक लाइव नहीं माना जाना चाहिए।

विस्तृत steps `PUBLISH_TO_GITHUB.md` में दिए गए हैं।

## Gemini वाला भाग

Website में prompt copy करने के लिए Gemini API key नहीं चाहिए। यदि आप सीधे Gemini API चलाना चाहते हैं तो `GEMINI_SETUP.md` देखें। API calls सिर्फ `--send` देने पर चलती हैं और provider की usage limits/charges लागू हो सकती हैं। अपनी API key GitHub पर upload **मत** करें।

**महत्वपूर्ण:** Favorites और अपने custom prompts केवल उसी ब्राउज़र के localStorage में रहते हैं। दूसरे मोबाइल पर अपने आप sync नहीं होंगे, इसलिए Export से backup रखें।
