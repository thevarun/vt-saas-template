# Technical Details

**Story-Specific Implementation Notes:**

**Story 1:**
- **Chat fixes require:** Debugging Assistant UI component props and CSS layout
- **Auth state:** Server Component pattern mandatory (no client-side session checks on landing)
- **i18n:** next-intl automatically handles routing for new locales once configured
- **Translations:** Hindi/Bengali translations can be initial English copies, refined later

**Story 2:**
- **Deletion order:** Files → imports → translations → schema → dependencies → configs
- **Migration:** One migration drops both tables atomically
- **Validation:** Build must succeed after each phase
- **No database backup needed:** Tables are completely unused

**Story 3:**
- **Test data:** Either create real Supabase test accounts or mock auth
- **Chat testing:** Requires valid Dify API key or mocked responses
- **Execution time:** Target <3 minutes for all tests
- **CI integration:** Already configured, tests run automatically on PR

**Story 4:**
- **README tone:** Professional, technical, no marketing fluff
- **Tech-spec (this doc):** Implementation-focused, not product-focused

---
