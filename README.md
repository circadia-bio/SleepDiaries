4. **Connect a backend** — replace the `AsyncStorage` placeholder with an API call to send data to your research database

---

## 👥 Authors

**Northumbria University**

| Role | Names |
|------|-------|
| Principal Investigators & Supervisors | Lucas França, Mario Miguel |
| Development | Lucas França |
| Design | Bri Baehl, Jacob Howard, Frederic Kussow, Yuliana Luna Colón |

---

## 🎨 Design Acknowledgement

The app design was created by exchange students — Bri Baehl, Jacob Howard, Frederic Kussow, and Yuliana Luna Colón — during the **7th Annual Digital Civics Exchange (DCX)**, an international programme connecting students across disciplines to co-design civic technologies.

🌐 [dcx.events](https://www.dcx.events/home)

---

## 🤖 AI Acknowledgement

Development of this app was assisted by **Claude** (Anthropic's AI assistant). Claude helped scaffold the React Native codebase, implement navigation, build the questionnaire engine, set up local storage, push notifications, data export, and the final report — all through conversation-driven development in a single session.

🔗 [claude.ai](https://claude.ai)

---

## 🤝 Contributing

Contributions are welcome. If you are adapting this for a research study and want to share improvements back, please open a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m '✨ feat: add my feature'`)
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~55.0.8 | Core Expo SDK |
| `expo-router` | ~55.0.7 | File-based navigation |
| `react-native` | 0.79.2 | Cross-platform mobile framework |
| `@expo/vector-icons` | ^14.0.0 | Ionicons icon set |
| `@react-native-async-storage/async-storage` | 2.2.0 | Local data persistence |
| `expo-notifications` | ~55.0.13 | Push notifications for reminders |
| `react-native-safe-area-context` | ~5.6.2 | Safe area handling |
| `react-native-screens` | ~4.23.0 | Native screen management |

---

## 📄 Licence

See [LICENSE](./LICENSE) for details.

---

## 🏗️ Roadmap

- [x] Persist answers with AsyncStorage
- [x] Show name entered at onboarding on home screen
- [x] Past entries screen with history view
- [x] Final report generation
- [x] Push notification reminders (morning + evening)
- [x] Data export (CSV / JSON)
- [ ] Backend API integration
- [ ] Multi-language support
