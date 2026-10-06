export const INITIAL_CITIES = {
  gokarna: {
    name: "Gokarna",
    state: "Karnataka",
    tagline: "Serene pristine beaches, cliff treks & laid-back coastal vibes",
    vibeTag: "Beach & Cliffs",
    heroImage: "https://images.unsplash.com/photo-1620619767323-b95a89183081?auto=format&fit=crop&w=800&q=80",
    estimatedDailyFood: 450,
    transit: {
      flights: [
        {
          id: "fl_gk_1",
          airline: "IndiGo 6E-654",
          route: "BLR -> GOX (Mopa) + 2h Cab",
          departure: "06:15 AM",
          arrival: "09:30 AM",
          duration: "3h 15m total",
          roundTripPrice: 5800,
          stops: "Direct Flight + Shuttle",
          isCheapest: true,
          badge: "Fastest Option"
        },
        {
          id: "fl_gk_2",
          airline: "Air India Express",
          route: "BLR -> IXE (Mangaluru) + Train",
          departure: "11:20 AM",
          arrival: "03:45 PM",
          duration: "4h 25m total",
          roundTripPrice: 6200,
          stops: "1 Stop Transit",
          badge: "Comfort Travel"
        }
      ],
      trains: [
        {
          id: "tr_gk_1",
          name: "Panchaganga Superfast (16595)",
          class: "3rd AC (3A)",
          departure: "06:50 PM",
          arrival: "08:15 AM (Next Day)",
          duration: "13h 25m",
          roundTripPrice: 1950,
          badge: "Most Popular Budget Pick",
          isCheapest: true
        },
        {
          id: "tr_gk_2",
          name: "Karwar Express (16523)",
          class: "Sleeper (SL)",
          departure: "07:30 PM",
          arrival: "09:30 AM",
          duration: "14h 00m",
          roundTripPrice: 920,
          badge: "Ultra Low Cost"
        }
      ],
      buses: [
        {
          id: "bu_gk_1",
          operator: "KSRTC Airavat Club Class Multi-Axle",
          type: "AC Sleeper (2+1)",
          departure: "09:15 PM",
          arrival: "07:45 AM",
          duration: "10h 30m",
          roundTripPrice: 2400,
          badge: "Overnight Sleeper",
          isCheapest: false
        },
        {
          id: "bu_gk_2",
          operator: "VRL Travels Volvo B11R",
          type: "AC Semi-Sleeper",
          departure: "10:00 PM",
          arrival: "08:30 AM",
          duration: "10h 30m",
          roundTripPrice: 2100,
          badge: "Direct Beach Drop",
          isCheapest: true
        }
      ]
    },
    hotels: [
      {
        id: "ht_gk_1",
        name: "Namaste Sanjeevini Beach Resort",
        type: "Eco Hillside & Sea View",
        rating: 4.6,
        reviewsCount: 1420,
        pricePerNight: 2100,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
        amenities: ["Kudle Beach 3 min", "Free Breakfast", "Hammock Garden", "WiFi"],
        badge: "Within Budget Match",
        serpRank: "#1 on Google Hotels"
      },
      {
        id: "ht_gk_2",
        name: "Zostel Gokarna (Main Cliff)",
        type: "Backpacker Pod & Deluxe Room",
        rating: 4.8,
        reviewsCount: 2890,
        pricePerNight: 1250,
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
        amenities: ["Cliff Sunset Deck", "Cafe & Co-work", "Social Vibes", "AC Dorms"],
        badge: "Highest Rated Backpacker",
        serpRank: "#2 on Google Hotels"
      },
      {
        id: "ht_gk_3",
        name: "Kahani Paradise Villa",
        type: "Boutique Coastal Stay",
        rating: 4.7,
        reviewsCount: 380,
        pricePerNight: 3400,
        image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
        amenities: ["Infinity Pool", "Om Beach Trail", "Free High Speed WiFi", "Organic Food"],
        badge: "Scenic Escape",
        serpRank: "#4 on Google Hotels"
      }
    ],
    events: [
      {
        id: "ev_gk_1",
        title: "Kudle Beach Sunset Acoustic Jam",
        category: "Live Music & Bonfire",
        date: "Saturday Night, 7:30 PM",
        venue: "Kudle Beach North End",
        entry: "Free entry",
        source: "google_events"
      },
      {
        id: "ev_gk_2",
        title: "Om Beach to Half Moon Night Trek",
        category: "Adventure & Stargazing",
        date: "Sunday, 5:30 AM",
        venue: "Om Beach Rock Trail",
        entry: "₹350 / person",
        source: "google_events"
      },
      {
        id: "ev_gk_3",
        title: "Artisan Flea & Local Coconut Craft Fair",
        category: "Cultural Bazaar",
        date: "Fri - Sun, 4:00 PM",
        venue: "Gokarna Town Temple Road",
        entry: "Free Walk-in",
        source: "google_events"
      }
    ],
    localFood: [
      {
        id: "fd_gk_1",
        name: "Chez Christophe French Shack",
        cuisine: "Fresh Nutella Crepes & Woodfire Pizza",
        avgMealPrice: 320,
        rating: 4.7,
        reviews: 950,
        location: "Middle Beach Cliff"
      },
      {
        id: "fd_gk_2",
        name: "Prema Restaurant (Since 1984)",
        cuisine: "Authentic Gadbad Ice Cream & Thalis",
        avgMealPrice: 180,
        rating: 4.5,
        reviews: 3100,
        location: "Main Market Street"
      },
      {
        id: "fd_gk_3",
        name: "Mantra Cafe (Kudle)",
        cuisine: "Avocado Toast, Prawn Curry & Cold Brew",
        avgMealPrice: 380,
        rating: 4.6,
        reviews: 1800,
        location: "Kudle Hill Top"
      }
    ]
  },

  pondicherry: {
    name: "Pondicherry",
    state: "Tamil Nadu",
    tagline: "French colonial quarters, golden promenade & vibrant cafe culture",
    vibeTag: "Heritage & Cafes",
    heroImage: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
    estimatedDailyFood: 550,
    transit: {
      flights: [
        {
          id: "fl_py_1",
          airline: "SpiceJet SG-104",
          route: "BLR -> PNY (Direct to Airport)",
          departure: "08:45 AM",
          arrival: "09:40 AM",
          duration: "55 mins",
          roundTripPrice: 4900,
          stops: "Non-stop Flight",
          isCheapest: true,
          badge: "Direct Landing in City"
        },
        {
          id: "fl_py_2",
          airline: "IndiGo 6E-208",
          route: "BLR -> MAA (Chennai) + Taxi on ECR",
          departure: "07:00 AM",
          arrival: "11:30 AM",
          duration: "4h 30m total",
          roundTripPrice: 5400,
          stops: "Flight + Scenic Highway",
          badge: "Flexible Slots"
        }
      ],
      trains: [
        {
          id: "tr_py_1",
          name: "Chalukya / Puducherry Express (11005)",
          class: "3rd AC (3A)",
          departure: "09:30 PM",
          arrival: "07:15 AM",
          duration: "9h 45m",
          roundTripPrice: 1750,
          badge: "Direct Overnight Rail",
          isCheapest: true
        },
        {
          id: "tr_py_2",
          name: "Vande Bharat via Chennai (20608)",
          class: "Chair Car (CC)",
          departure: "05:45 AM",
          arrival: "12:15 PM",
          duration: "6h 30m",
          roundTripPrice: 2400,
          badge: "Premium High Speed"
        }
      ],
      buses: [
        {
          id: "bu_py_1",
          operator: "IntrCity SmartBus AC Sleeper",
          type: "Luxury Volvo Sleeper",
          departure: "11:00 PM",
          arrival: "06:30 AM",
          duration: "7h 30m",
          roundTripPrice: 1800,
          badge: "Overnight Comfort",
          isCheapest: true
        },
        {
          id: "bu_py_2",
          operator: "KSRTC FlyBus Super Deluxe",
          type: "AC Multi-Axle",
          departure: "10:15 PM",
          arrival: "06:00 AM",
          duration: "7h 45m",
          roundTripPrice: 1950,
          badge: "Clean & On-Time"
        }
      ]
    },
    hotels: [
      {
        id: "ht_py_1",
        name: "Villa Shanti Heritage Hotel",
        type: "19th Century French Mansion",
        rating: 4.8,
        reviewsCount: 3200,
        pricePerNight: 2800,
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80",
        amenities: ["White Town Center", "Courtyard Cafe", "Free Bicycle Rental", "Air Conditioned"],
        badge: "Top French Quarter Stay",
        serpRank: "#1 on Google Hotels"
      },
      {
        id: "ht_py_2",
        name: "Maison Perumal - CGH Earth",
        type: "Tamil Heritage Courtyard",
        rating: 4.7,
        reviewsCount: 1650,
        pricePerNight: 2350,
        image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80",
        amenities: ["Traditional Architecture", "Authentic Cuisine", "Promenade 8 min", "High Speed WiFi"],
        badge: "Budget Friendly Heritage",
        serpRank: "#3 on Google Hotels"
      },
      {
        id: "ht_py_3",
        name: "Dune Eco Village & Spa",
        type: "Seaside Organic Cottages",
        rating: 4.5,
        reviewsCount: 2100,
        pricePerNight: 3100,
        image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80",
        amenities: ["Private Beach Access", "Ayurvedic Spa", "Solar Powered", "Pet Friendly"],
        badge: "Serene Nature Stay",
        serpRank: "#5 on Google Hotels"
      }
    ],
    events: [
      {
        id: "ev_py_1",
        title: "French Heritage Open Courtyard Jazz Fest",
        category: "Live Jazz & Wine",
        date: "Saturday Night, 8:00 PM",
        venue: "Alliance Française de Pondichéry",
        entry: "Free Entry / RSVP",
        source: "google_events"
      },
      {
        id: "ev_py_2",
        title: "Rock Beach Weekend Night Market & Buskers",
        category: "Street Market & Art",
        date: "Every Sat - Sun 6:00 PM",
        venue: "Goubert Avenue Promenade",
        entry: "Free Walk-in",
        source: "google_events"
      },
      {
        id: "ev_py_3",
        title: "Auroville Organic Sourdough & Clay Workshop",
        category: "Hands-on Experience",
        date: "Sunday Morning, 10:00 AM",
        venue: "Auroville Visitor Center",
        entry: "₹450 / person",
        source: "google_events"
      }
    ],
    localFood: [
      {
        id: "fd_py_1",
        name: "Cafe des Arts",
        cuisine: "Croque-Monsieur, Baguettes & Hibiscus Iced Tea",
        avgMealPrice: 380,
        rating: 4.7,
        reviews: 4200,
        location: "Suffren Street, White Town"
      },
      {
        id: "fd_py_2",
        name: "Surguru Vegetarian",
        cuisine: "Crispy Ghee Roast Dosa & Filter Coffee",
        avgMealPrice: 150,
        rating: 4.6,
        reviews: 8900,
        location: "Heritage Town"
      },
      {
        id: "fd_py_3",
        name: "Coromandel Cafe",
        cuisine: "Artisan Pasta, Salted Caramel Tarts & Cocktails",
        avgMealPrice: 550,
        rating: 4.8,
        reviews: 3400,
        location: "Romain Rolland Street"
      }
    ]
  }
};

export const TESTIMONIALS = [
  {
    id: 1,
    name: "Arjun & Sneha K.",
    location: "Bengaluru, Tech Professionals",
    comment: "We used to waste 3 hours on a Friday night toggling between MakeMyTrip, Skyscanner and Airbnb. This comparator calculated the true damage (stay + cabs + local food) in 5 seconds and showed us Pondicherry saved ₹4,200 compared to Goa!",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    savings: "Saved ₹4,200",
    verified: "Verified Hackathon Tester"
  },
  {
    id: 2,
    name: "Rahul Deshmukh",
    location: "Pune, College Backpackers",
    comment: "Rohan the Budget CA AI bot is hilarious but brutally accurate! It warned us that Goa flights would blow 65% of our pocket money and guided our 4-person gang to Gokarna with overnight sleeper buses. Epic weekend without going broke.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    savings: "Saved ₹8,900 for gang",
    verified: "Backpacker Tribe"
  },
  {
    id: 3,
    name: "Ananya Sen",
    location: "Chennai, Solo Explorer",
    comment: "The live google_events integration is a game-changer. Most AI trip apps suggest tourist traps that closed 2 years ago. Maya found a live indie jazz night happening that exact Saturday at Alliance Française!",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    savings: "Found 3 Live Events",
    verified: "Solo Wanderer"
  }
];

export const HACKATHON_CREDITS = {
  eventName: "SerpApi India Hackathon 2026",
  track: "Travel & Local Discovery Track",
  deadline: "October 10, 2026, 11:59 PM IST",
  team: [
    { role: "Member 1 (Flight Scout)", task: "Google Flights API & Multi-Modal Transit Engine" },
    { role: "Member 2 (Stay Finder)", task: "Google Hotels API & Budget-Capped Stay Filtering" },
    { role: "Member 3 (Local Discovery)", task: "Google Events & Google Local Street Reality Scraper" },
    { role: "Member 4 (Budget CA & AI)", task: "Dual AI Debate Engine (Rohan & Maya) via Gemini API" },
    { role: "Member 5 (UI Lead)", task: "Bento Grid, Postcard Aesthetic, Mad-Libs Sentence Bar & Demo" },
  ],
  techStack: [
    "React 18 & Vite",
    "Tailwind CSS (Sandalwood & Crimson Aesthetic)",
    "SerpApi (google_flights, google_hotels, google_events, google_local)",
    "Google Gemini Pro API (Dual Bot System)",
    "Lucide Modern Icons"
  ]
};
