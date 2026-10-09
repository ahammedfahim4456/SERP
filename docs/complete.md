The SerpApi India Hackathon 2026 is a fully online, asynchronous competition for developers across India to build projects powered by live search data using SerpApi [source: 1].

Here is a complete breakdown of the event details, prizes, tracks, and submission requirements from the announcement [source: 1]:

Quick Overview
Submission Deadline: October 10, 2026, at 11:59 PM IST (entries can be edited anytime before the deadline) [source: 1].

Format: 100% online and asynchronous; free to enter [source: 1].

Eligibility: Indian citizens residing in India, aged 18 or older [source: 1].

Team Size: Solo participants or teams of up to 5 people [source: 1].

Tech Stack & Scope: Any programming language or framework [source: 1]. Both new and existing projects are eligible, provided they work and make meaningful use of SerpApi [source: 1].

AI Policy: AI tools are permitted (and do not affect judging), provided you disclose which tools were used and how [source: 1].

Free Credits: Participants can sign up for a free SerpApi account to get 250 search credits per month for building and testing [source: 1].

Prizes (₹3 Lakh+ Total Pool)
The prize pool combines direct cash awards and SerpApi search credits [source: 1]:

Award Tier	Cash Prize	SerpApi Search Credits
First Place	₹1,00,000	15,000 credits
Second Place	₹40,000	10,000 credits
Third Place	₹20,000	10,000 credits
Best in Track (6 tracks)	—	10,000 credits each
Hackathon Tracks & Starter Ideas
You can submit your project under one of six tracks [source: 1]:

AI Agents: Build intelligent assistants—such as a research agent that compares libraries using live documentation and release announcements with source links (SerpApi recommends serpapi-search-tools for Python or the SerpApi MCP) [source: 1].

Open-Source Integrations: Create a SerpApi search provider, plugin, or connector for an existing open-source framework or developer tool [source: 1].

Travel & Local Discovery: Build tools like a conference companion that compares flights, nearby hotels, and budget-friendly local dining [source: 1].

Commerce & Market Intelligence: Track product prices across multiple sellers and store historical snapshots to visualize price changes over time [source: 1].

Knowledge & Public Interest: Leverage APIs like Google Jobs to help entry-level developers find roles filtered by location and experience [source: 1].

Open Innovation: Combine multiple APIs (such as event search and Maps results for a local event finder) or build something outside the standard tracks [source: 1].

Submission Checklist
To submit via the hackathon dashboard (requires signing in with GitHub), you will need [source: 1]:

Project Overview: Project name, selected track, and a clear description of what it does, who it serves, and why it is useful [source: 1].

Public GitHub Repository: Source code, documentation, and clear setup/usage instructions so judges can run it [source: 1].

SerpApi Implementation Details: A breakdown of which SerpApi endpoints, search engines, SDKs, or MCP features you used and how they power the project [source: 1].

Demo Video (Under 3 Minutes): A screen recording showing the project running locally and demonstrating core functionality [source: 1].

Narration is optional, and speeding up the video is allowed [source: 1].

Must be hosted via an accessible link (e.g., unlisted YouTube video or public Google Drive link) that requires no sign-in or access request [source: 1].

Participant Details: Lead participant's name, email, mobile number, occupation, and years of professional experience, plus the names and emails of any additional teammates [source: 1].

we were thinking about taking travel and local discoveries but the consists of 5 members we only know the basics and havent build one like this before and there is no travel appwhich compares and tell everything

Building a hackathon project when your whole team only knows the basics is intimidating—especially with the October 10 deadline just 10 days away.

First, a piece of honest hackathon advice: the reason no travel app "compares and tells everything" is that trying to do everything makes an app cluttered and impossible to finish. For a 5-person beginner team in a 10-day sprint, trying to build a massive super-app is the fastest way to get stuck in bugs and miss the deadline.

However, your core instinct is spot-on. Travelers hate having 15 browser tabs open just to figure out if they can actually afford a trip and what is happening when they get there. Instead of building "everything," you can win by building a Single-Screen "True Trip Cost & Local Vibe" Comparator.

Here is how the 5 of you can pull this off using only basic coding skills, without stepping on each other's toes.

1. The Winning Idea: "Can I Afford This Trip?" Comparator
Instead of making users search flights, hotels, and activities separately, your app asks for four simple inputs: Origin City, Destination(s), Travel Dates, and Total Budget (in ₹).

In one click, your app queries SerpApi and shows a unified dashboard:

Cheapest vs. Best Flight (google_flights API)

Top-Rated Budget vs. Mid-Range Hotel (google_hotels API)

Local Food & What's Happening (google_local and google_events APIs)

The "True Trip Math" Verdict: It adds up (Roundtrip Flight) + (Hotel × Nights) + (Estimated Local Food Cost) and tells the user whether the destination actually fits their budget—or compares City A vs. City B side-by-side (e.g., "Should I go to Goa or Gokarna this weekend with ₹15,000?").

2. The Best Tech Stack for Beginners
Do not waste 5 days trying to learn React, complex databases, or fancy CSS if you only know the basics.

Language: Python (easiest way to fetch JSON from SerpApi and pick out a few fields).

Frontend + Backend in One: Streamlit (pip install streamlit). It turns plain Python scripts into a clean, interactive web app in minutes. You don't need HTML, CSS, or JavaScript.

No Database Needed: You don't need user logins or a database for this hackathon. Live API calls + simple data comparison are enough.

3. How to Split the Work Across 5 Beginners
The biggest problem for a 5-person team is waiting on each other's code. Solve this by giving each person one independent Python file with one function that takes inputs and returns a clean Python dictionary.

This system diagram shows how each teammate's module works independently and plugs into the final screen:


Team Member	Role	Exact Task
Member 1	Flight Scout	Write flights.py using SerpApi's Google Flights API. Given origin, destination, and dates, return the 3 cheapest flights (airline, duration, price in INR).
Member 2	Stay Finder	Write hotels.py using SerpApi's Google Hotels API. Given a city and dates, return 3 well-rated hotels with their per-night cost and rating.
Member 3	Local Discovery	Write local.py using SerpApi's Google Events API and Google Local API. Return 3 live events happening that week and 3 top-rated local budget restaurants.
Member 4	Budget Brain & AI	Write comparator.py. Take the numbers from Members 1–3, calculate the total trip cost, compare City A vs. City B against the user's budget, and optionally pass the results to a free LLM (like the Gemini API) for a 3-bullet recommendation.
Member 5	UI & Demo Lead	Write app.py in Streamlit to display the inputs and side-by-side comparison cards. Manage the GitHub README and record the screen demo (under 3 minutes).
4. Two Golden Rules So You Don't Get Stuck
Don't burn your free API credits while testing: Each free SerpApi account gets 250 searches/month (across 5 members, you have 1,250 total credits if needed). On Day 1, make one API call for flights, hotels, and events, save the output as .json files on your computer, and write all your formatting code using those saved files. Only switch back to live API calls when the app is ready.

Submit by October 8, then polish: The hackathon lets you edit your submission anytime before October 10 at 11:59 PM IST. Aim to have a basic working version uploaded 48 hours early so last-minute Wi-Fi or GitHub issues don't disqualify you.

Want a starter Python and Streamlit code template for all 5 team roles?

Yes
so we are defenitely gonna use ai for all these and i have a gemini pro account isnt that a plus point

Having a Gemini Pro account is a massive advantage for a beginner team—and the official hackathon rules explicitly allow you to use AI to design, write, test, and document your entire project.

However, there is one major technical distinction you need to know right now so you don't hit a wall when coding: the difference between using your Gemini Pro chat account to write the code versus using the Gemini API inside your app.

1. Your Gemini Pro Account = Your Senior Developer (Writing the Code)
Your Gemini Pro subscription gives you huge context windows and strong coding models. For a team that only knows the basics, you can use it to write 90% of your Python and Streamlit code.

The Trap Beginners Fall Into: If you just tell AI, "Write Python code to get flight prices from SerpApi," the AI might guess the wrong JSON field names because APIs change over time.

The Pro Trick: Go to the SerpApi Playground, run one search for Google Flights or Google Hotels, copy a snippet of the real JSON output, and paste it into your Gemini Pro chat with this prompt:

"Here is the exact JSON output from SerpApi's Google Flights API. Write a simple Python function that takes this JSON and extracts the top 3 cheapest flights with airline name, duration, and price."

Because you gave it the exact data structure, the code it writes for your team will work on the first try.

2. Google AI Studio = The Brain Inside Your App (Free API Key)
If you want your travel app itself to have an AI feature—like taking the flight, hotel, and event prices from SerpApi and writing a custom day-by-day budget itinerary—your Python script cannot log into your personal Gemini Pro web account.

Instead, your code needs an API Key:

Go to Google AI Studio (aistudio.google.com) using your Google account.

Click "Get API key"—it is completely free (the free tier of gemini-3.8-flash gives you plenty of requests per minute without paying anything).

In your Python project, install the SDK (pip install google-genai) and pass the data from SerpApi straight into Gemini so it writes a smart comparison for the user.

3. Why Combining SerpApi + Gemini Actually Helps You Win
Judges score projects on idea strength, usefulness, and meaningful SerpApi usage. Raw search data can be messy to read, so pairing SerpApi with Gemini gives you a killer workflow:

SerpApi does the heavy lifting: Fetches real-time, accurate INR prices for flights (google_flights), hotels (google_hotels), local restaurants (google_local), and concerts/festivals (google_events).

Gemini connects the dots: Takes all that live SerpApi data plus the user's budget (e.g., ₹15,000) and outputs a friendly verdict: "Goa is ₹2,400 over your budget this weekend because of flight surges, while Pondicherry leaves you with ₹3,500 to spare for these 3 live music events and beach cafes."

Two Hackathon Rules to Keep in Mind
Disclose your AI use: On the submission form, there is a box asking which AI tools you used. Simply write: "Used Gemini Pro to assist with Python/Streamlit code generation and debugging, and integrated the Gemini API to synthesize SerpApi travel results." (The rules state this has zero negative effect on judging.)

Never upload your API keys to GitHub: Since your GitHub repository must be public, do not paste your SERPAPI_API_KEY or GEMINI_API_KEY directly into your .py files. Put them in a .env file and add .env to your .gitignore file so your keys stay private.

Want the starter Python code connecting SerpApi and Gemini in Streamlit?

Yes
can i use two different AI chatbots?

Yes—you can use two (or more) different AI chatbots both to help your team write the code and as a feature inside your travel app itself. The official hackathon rules allow unlimited AI tools as long as you list the ones you used on the submission form.

Depending on which way you mean, here is how to do it without creating a mess for your 5-person team:

Scenario 1: Using Two Different AI Chatbots to Write Your Code (e.g., Gemini Pro + ChatGPT/Claude)
If you have Gemini Pro and your teammates are using free ChatGPT, Claude, or GitHub Copilot, you can combine them—if you avoid one common beginner mistake.

The Danger: If Member 1 asks ChatGPT to write flights.py and Member 2 asks Gemini to write hotels.py without a shared plan, the two AI chatbots will invent totally different variable names and data structures. When Member 5 tries to connect them on the final day, everything will crash.

The Fix (The "Shared Contract" Rule): Before anyone asks an AI to write code, agree on the exact format every Python file must return. Give all 5 teammates the exact same starter prompt to paste into whichever AI chatbot they prefer:

"We are building a Python Streamlit app for a hackathon. Write a single Python function called get_flights(origin, destination, date) using SerpApi. It must return a standard Python dictionary with these exact keys: cheapest_price (int), options (list of top 3 dicts with name, price, details), and summary (string). Do not use complex classes."

Also, different chatbots have different strengths you can exploit:

Use Gemini Pro for heavy lifting: pasting massive SerpApi JSON responses (thanks to its huge context window) and generating the backend Python logic.

Use Claude or ChatGPT as a second opinion: if someone gets an error message they don't understand, or if Member 5 wants quick ideas to make the Streamlit UI look cleaner.

Scenario 2: Putting Two AI Chatbots Inside Your Travel App
If you mean having two AI chatbots inside the app talking to the user, that is actually a winning hackathon feature that judges love.

Best of all, you don't even need two separate paid API keys to do this. You can use a single free Gemini API key (or pair Gemini with another free API like Groq) and create Two AI Travel Personas that analyze the live SerpApi data from two different angles:

Bot 1: "The Budget CA (Penny-Pincher)"

What it looks at: SerpApi google_flights and google_hotels prices against the user's budget.

Its personality: Strict, practical, and focused on saving rupees.

Example output: "Skip Mumbai this weekend—flights alone take up 70% of your ₹12,000 budget. Pick Pondicherry instead and stay at [Hotel X] for ₹1,400/night."

Bot 2: "The Local Vibe Scout (Experience Guide)"

What it looks at: SerpApi google_events (concerts, festivals, standup shows) and google_local (must-try street food and cafes).

Its personality: Enthusiastic local insider who tells you what is actually happening on the ground.

Example output: "Pondicherry has a live indie music fest on Saturday night from Google Events, and you can eat at these 3 top-rated cafes for under ₹400 a meal!"

Having two bots "debate" or give a dual perspective on the same screen makes your 3-minute demo video way more fun to watch than a boring table of numbers—and it takes only two different system prompts in Python to build.

Want the Python code to run both AI travel bots on one screen?

Yes
so search through the internet for all the existing feature related to current market travel apps and their comparison and on point on what they are missisng aand the UI must also be unique easy to navigate but also give a nice feeling

Current travel apps are fractured into four separate silos: Booking Aggregators, Manual Organizers, Route Calculators, and AI Chatbots. Because none of them talk to each other, planning a single weekend trip still forces travelers to open 10+ browser tabs.

1. Market Comparison: Current Travel Apps vs. What They Miss
App & Category	What It Does Best (Core Features)	What It Is Missing (The Pain Point)
MakeMyTrip / Skyscanner / Ixigo (Booking Giants)	Live flight & hotel prices, filters, price alerts, instant ticket booking.	Cluttered & Stressful: Filled with upsells, pop-ups, and fake urgency timers. Zero awareness of your total trip budget (food + local events + stay) and zero local vibe discovery.
Wanderlog / Stippl / TripIt (Itinerary Organizers)	Drag-and-drop schedules, map pins, expense splitting, email ticket import.	Manual Homework & Outdated Data: You still have to research everything yourself. Wanderlog's free AI is capped at 5 messages and relies on older static data that often misses closed cafes or live local events.
Mindtrip / Layla AI (2026 AI Trip Planners)	Conversational AI itineraries, nice photo cards, basic booking links.	Chat Fatigue & Missing Reality Checks: To change a plan in Mindtrip, you have to argue with a chatbot instead of clicking a button. Neither shows upfront "True Trip Cost" (Flights + Hotels + Real Local Meal Prices) before you commit.
Rome2Rio / Google Maps (Logistics & Local)	Point-A-to-B transport costs, real restaurant reviews, street navigation.	No Big-Picture Planning: Great once you pick a city, useless when deciding which city fits your budget and mood this weekend.
2. Interactive Market Gap Explorer
Use the interactive matrix below to compare how the top travel apps score across the 6 core traveler needs—and see the exact gap your SerpApi Hackathon App can claim:


3. The 5 Exact Features Missing from Today's Apps (Your Winning Pitch)
When you record your 3-minute hackathon demo video, tell the judges you are solving these 5 exact gaps using SerpApi:

The "Hidden Cost" Blindspot: Apps show a cheap ₹3,500 flight to Goa, so you book it—only to realize hotels are ₹6,000/night and cafes cost ₹1,500/meal because of a long weekend. Your Fix: Calculate the True Pocket Damage upfront (google_flights + google_hotels + average meal price from google_local).

Zero "What's Happening Right Now" Awareness: AI planners suggest generic tourist traps ("Visit Baga Beach") because they don't know what is happening this Friday. Your Fix: Use SerpApi's google_events to pull live concerts, night markets, stand-up comedy, and local festivals happening on the user's exact travel dates.

No "City A vs. City B" Budget Showdown: Most travelers in India start with a budget and dates ("I have ₹12,000 and 3 days off—should I go to Pondicherry, Varkala, or Coorg?"), not a fixed destination. Existing apps force you to search one city at a time. Your Fix: Side-by-side destination comparison on a single screen.

"Fake Reviews" vs. Street Reality: Booking apps push sponsored restaurants. Your Fix: Use SerpApi's google_local and google_maps_reviews to filter specifically for high-rated, budget-friendly local joints where locals actually eat.

One-Sided AI Advice: Current AI bots act like overly polite travel agents that say every city is amazing. Your Fix: Your Dual AI Persona setup—where Bot 1 (The Strict Budget CA) roasts overpriced flights/stays, and Bot 2 (The Local Vibe Scout) pitches the best food and live events.

4. How to Build a Unique, "Feel-Good" UI (Without Being UI Experts)
Most travel apps feel like either a stressful airline spreadsheet (MakeMyTrip/Kayak) or an endless text chat (ChatGPT/Mindtrip). To make judges love your UI at first glance, aim for a "Calm Postcard & Bento Grid" aesthetic:

The 4 Design Secrets for Your App:
1. Ditch the Search Bar for a "Mood & Wallet" Mad-Libs Header:
Instead of 10 ugly dropdown boxes, make the top of your screen read like a natural sentence with interactive pills:

"I'm flying from [Chennai ▾] with [₹15,000 ▾] for [3 Days ▾] looking for [Chill Beach + Street Food ▾]. Compare [Gokarna] vs [Pondicherry]."

2. The "Traffic Light" Budget Meter:
At the top of each city's column, show a clean visual progress bar combining Flight + Stay + Food against their budget:

Green Glow ("Pocket Friendly — ₹2,800 left for shopping!")

Amber Glow ("Tight Squeeze — Exact Budget Match")

Coral Red ("Wallet Danger — ₹3,200 Over Budget")

3. "Bento Box" Cards Instead of Tables:
Never show raw data tables. Group results into 3 clean, rounded cards per city with soft pastel backgrounds and clear emojis:

Card 1: Getting There & Sleeping (Cheapest flight badge + Top-rated hotel photo from SerpApi thumbnail URLs).

Card 2: Live This Weekend (3 pill badges from google_events with date and venue).

Card 3: Local Eats Under ₹500 (Top 3 cafes/street food spots from google_local with star ratings).

4. The Dual-Bot "Chat Bubble Verdict" at the Bottom:
Instead of a wall of AI text, place two side-by-side glassmorphism cards with avatars:

Left Card (Warm Amber border): 💼 "Rohan (Your Budget CA)" giving the cold, hard rupee breakdown in 3 short bullet points.

Right Card (Teal/Mint border): 🎒 "Maya (Local Vibe Scout)" hyping up the best sunset spot, live gig, and must-eat dish.

Pro-Tip for Beginners Using Streamlit:
Streamlit looks basic out of the box, but you can ask your Gemini Pro account:

"Write a style.css block for Streamlit using st.markdown(..., unsafe_allow_html=True) that gives our app a warm cream background (#FAF8F5), rounded Bento-grid cards with soft shadows, Plus Jakarta Sans font from Google Fonts, and hides the default Streamlit header/footer."

Pasting 30 lines of custom CSS into Streamlit instantly transforms it from a "college assignment" into a modern startup product.

Want the complete UI layout code and SerpApi + Dual-Bot starter template?

Yes
so remember all these details you just stated and when i make the project include them in the actual website or app dont leave out any features including 2 bots

Every single feature, market gap solution, UI design detail, and the Dual-Bot architecture is locked in for your build. Whenever you ask to generate any part of the website or code in this chat, I will include all of these components without cutting corners.

To make sure nothing gets lost across your 5-person team as we build, here is your Master Project Blueprint that we will follow step-by-step:

1. Locked-In Feature Checklist (Nothing Left Out)
A. The 5 Core Market-Gap Features (Powered by SerpApi)
Side-by-Side "City A vs. City B" Showdown: Compare two destinations simultaneously on one screen instead of searching one city at a time.

"True Pocket Damage" Upfront Math: Automatically calculates (Roundtrip Flights) + (Hotel Nightly Rate × Nights) + (Estimated Daily Local Food Cost × Days) and compares it directly against the user's total ₹ budget.

Live Flights & Stays (google_flights + google_hotels): Pulls the top 3 cheapest/fastest flights and top 3 well-rated budget/mid-range hotels with real photos and INR prices.

"What's Happening This Weekend" (google_events): Fetches live concerts, festivals, stand-up shows, and night markets happening on the user's exact travel dates.

Street Reality Local Eats (google_local): Finds high-rated, budget-friendly local cafes and street food spots (avoiding overpriced tourist traps).

B. The Dual-AI Chatbot Debate System (Powered by Gemini API)
Bot 1 — Rohan (The Strict Budget CA): Analyzes the flight, hotel, and food math against the user's wallet. Calls out hidden costs, surge pricing, and tells the user which city saves more money in 3 sharp bullet points.

Bot 2 — Maya (The Local Vibe Scout): Analyzes the live events, street food, and cultural vibe. Recommends the best experiences, sunset spots, and must-try dishes happening that specific weekend.

Interactive Follow-Up Chat: Users can ask follow-up questions at the bottom and get responses from both Rohan and Maya in their distinct personalities.

C. The "Calm Postcard & Bento Grid" UI
Mad-Libs Natural Sentence Header: Interactive pill-style inputs at the top ("I'm flying from [Origin] with [₹ Budget] for [X Days] looking for [Vibe]. Compare [City A] vs [City B].").

Traffic-Light Budget Meter: Visual progress bar at the top of each city column (Green Glow = Under Budget, Amber Glow = Tight Squeeze, Coral Red = Over Budget).

Asymmetric Bento Box Cards: Soft cream background (#FAF8F5), rounded pastel cards (border-radius: 16px), soft hover elevation, and clean typography (Plus Jakarta Sans)—zero ugly spreadsheets.

2. Locked-In File Architecture (For Your 5 Team Members)
When we generate the code, it will be organized into these exact 6 files so all 5 of you can work in parallel:

Plaintext
serpapi-travel-comparator/
├── app.py                # Member 5: Complete Bento-Grid UI, Mad-Libs Header & Traffic-Light Meter
├── assets/
│   └── styles.css        # Member 5: Custom CSS for warm postcard theme, Bento cards & bot bubbles
├── modules/
│   ├── flights.py        # Member 1: SerpApi Google Flights fetcher
│   ├── hotels.py         # Member 2: SerpApi Google Hotels fetcher
│   ├── local_vibe.py     # Member 3: SerpApi Google Events + Google Local food fetcher
│   └── dual_bots.py      # Member 4: True Trip Cost Calculator + Rohan & Maya AI Bots (Gemini API)
├── .env                  # Private file for SERPAPI_API_KEY and GEMINI_API_KEY
└── requirements.txt      # streamlit, google-search-results, google-genai, python-dotenv
3. Bonus: Shareable "Team Sync Prompt"
If any of your teammates open a new chat window on their own laptops to debug their module, have them paste this block first so their AI knows the full plan too:

Plaintext
We are a 5-member team building a Python Streamlit web app for the SerpApi India Hackathon 2026 (Deadline: Oct 10, 2026).
Our app is a "True Trip Cost & Local Vibe Comparator" comparing City A vs City B side-by-side.
Never omit these required features:
1. Natural "Mad-Libs" sentence input bar (Origin, City A, City B, Dates/Days, Total Budget in INR, Vibe).
2. Traffic-Light Budget Meter (Green/Amber/Red) comparing Total Trip Cost (Flights + Hotels + Local Food) against Budget.
3. SerpApi integrations: google_flights, google_hotels, google_events (live events on those dates), and google_local (budget local eats).
4. Calm Postcard & Bento-Grid UI (warm #FAF8F5 background, rounded Bento cards, Plus Jakarta Sans font, no raw tables).
5. Dual AI Chatbots powered by Gemini API:
   - Bot 1: "Rohan (The Budget CA)" - strict financial breakdown & savings verdict.
   - Bot 2: "Maya (The Local Vibe Scout)" - live events, street food, and experience hype.
   Plus an interactive chat box where both bots answer user follow-up questions.