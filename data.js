// BAZA PODATAKA NEKRETNINA (data.js)

const propertiesDB = {
  // --- PROPERTY 1: TODI VILLA (FULL DETALJI) ---
  1: {
    title: "Luxury Design Villa with Pool",
    location: "Umbria – Perugia – Todi",
    lifestyle: "Country",
    type: "Villa",
    price: "€ 1.985.000",
    sqm: "600 m²",
    land: "1.40 Ha",
    beds: "4",
    baths: "4",
    mainImg: "images/prop1-main.jpg",

    // OPIS
    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"A rare fusion of modern design & traditional craftsmanship."</p>
            <p class="mb-4">Set amidst the rolling hills of Umbria, just a short <strong>10-minute drive from the historic town of Todi</strong>, this exceptional contemporary villa offers sweeping views over the surrounding countryside.</p> 
            <p class="mb-6">Built in 2016, the property enjoys a privileged panoramic position with an atmosphere of absolute privacy. It serves perfectly as a year-round residence or a high-end rental investment.</p>
        `,

    // FEATURES (MINIMALISTIČKE IKONE)
    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Features</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    
                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 14.5c-.5-2 1-3.5 2.5-3.5s2.5 1 2.5 3c0-2 1.5-3 2.5-3s2.5 1 2.5 3c0-2 1.5-3 2.5-3s2.5 1 2.5 3M4 18.5c-.5-2 1-3.5 2.5-3.5s2.5 1 2.5 3c0-2 1.5-3 2.5-3s2.5 1 2.5 3c0-2 1.5-3 2.5-3s2.5 1 2.5 3c0-2 1.5-3 2.5-3s2.5 1 2.5 3M18 5v6m3-6v6M4 6h10"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Heated Swimming Pool (12x6m)</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Private Garden & Olive Grove</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Underfloor Heating & AC</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path></svg>
                        <span class="text-sm text-gray-600 font-light">High-speed Internet</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Excellent Condition (2016)</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Independent Studio</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Panoramic Views</span>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">BBQ Area with Pergola</span>
                    </div>
                </div>
            </div>
            
            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Places of Interest</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Supermarket</span>
                            <span class="text-sm text-gray-500 font-light">6 km (10 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Todi Center</span>
                            <span class="text-sm text-gray-500 font-light">8 km (15 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Orvieto</span>
                            <span class="text-sm text-gray-500 font-light">35 km (45 min)</span>
                        </li>
                         <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Rome Airports</span>
                            <span class="text-sm text-gray-500 font-light">160 km (1h 50m)</span>
                        </li>
                  </ul>
              </div>
        `,

    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d47156.46736417737!2d12.3857876!3d42.7820888!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x132ea764f434057f%3A0x4082c90e3e59f40!2s06059%20Todi%2C%20Province%20of%20Perugia%2C%20Italy!5e0!3m2!1sen!2shr!4v1706648293405!5m2!1sen!2shr",

    gallery: [
      "images/prop1-1.jpg",
      "images/prop1-2.jpg",
      "images/prop1-3.jpg",
      "images/prop1-4.jpg",
      "images/prop1-5.jpg",
      "images/prop1-6.jpg",
      "images/prop1-7.jpg",
      "images/prop1-8.jpg",
      "images/prop1-9.jpg",
      "images/prop1-10.jpg",
      "images/prop1-11.jpg",
      "images/prop1-12.jpg",
      "images/prop1-13.jpg",
      "images/prop1-14.jpg",
      "images/prop1-15.jpg",
      "images/prop1-16.jpg",
      "images/prop1-17.jpg",
      "images/prop1-18.jpg",
      "images/prop1-19.jpg",
      "images/prop1-20.jpg",
    ],
  },

  // --- PROPERTY 2: AREZZO VILLA (FULL DETALJI) ---
  2: {
    title: "Country House with Pool on the Hills",
    location: "Tuscany – Arezzo – Civitella",
    lifestyle: "Country",
    type: "Country House",
    price: "€ 1.620.000",
    sqm: "585 m²",
    land: "12.87 Ha",
    beds: "6",
    baths: "5",
    mainImg: "images/prop2-main.jpg",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"A typical Tuscan stone building, renovated with spacious interiors & modern comforts."</p>
            <p class="mb-4">Located on the hills of <strong>Arezzo, Tuscany</strong>, this magnificent property offers spectacular views toward the medieval village of Civitella in Val di Chiana. The villa combines historic charm with a newly built modern kitchen and bright living spaces.</p> 
            <p class="mb-6">The sale includes a <strong>700 m² ruined farmhouse</strong> ideal for restoration as a guest house, making this a property with immense potential. Sold fully furnished.</p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Features & Amenities</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    
                    <div class="flex items-center gap-3">
                        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 14.5c-.5-2 1-3.5 2.5-3.5s2.5 1 2.5 3c0-2 1.5-3 2.5-3s2.5 1 2.5 3c0-2 1.5-3 2.5-3s2.5 1 2.5 3M4 18.5c-.5-2 1-3.5 2.5-3.5s2.5 1 2.5 3c0-2 1.5-3 2.5-3s2.5 1 2.5 3c0-2 1.5-3 2.5-3s2.5 1 2.5 3M18 5v6m3-6v6M4 6h10"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Pool (12x5m) with Solarium</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                        <span class="text-sm text-gray-600 font-light">12.87 Ha & 550 Olive Trees</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Sold Fully Furnished</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                        <span class="text-sm text-gray-600 font-light">700m² Ruin to Restore</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">BBQ, Pizza Oven & Bocce</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 14.66V20a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h2.34"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 2v20M12 12a4 4 0 014 4"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Artesian Well & Irrigation</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Radiator + Air-Conditioning</span>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Internet Connection</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Places of Interest</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Local Services</span>
                            <span class="text-sm text-gray-500 font-light">4 km (5 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Arezzo</span>
                            <span class="text-sm text-gray-500 font-light">24 km (30 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Siena</span>
                            <span class="text-sm text-gray-500 font-light">46 km (45 min)</span>
                        </li>
                         <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Florence</span>
                            <span class="text-sm text-gray-500 font-light">63 km (1h 05m)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Florence Airport</span>
                            <span class="text-sm text-gray-500 font-light">85 km (1h 10m)</span>
                        </li>
                  </ul>
              </div>
        `,

    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d46376.62143764831!2d11.72898963177741!3d43.40775836261596!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x132be5566f1e6749%3A0x6b801452f10257e!2s52041%20Civitella%20in%20Val%20di%20Chiana%2C%20Province%20of%20Arezzo%2C%20Italy!5e0!3m2!1sen!2shr!4v1706655100123!5m2!1sen!2shr",

    gallery: [
      "images/prop2-1.jpg",
      "images/prop2-2.jpg",
      "images/prop2-3.jpg",
      "images/prop2-4.jpg",
      "images/prop2-5.jpg",
      "images/prop2-6.jpg",
      "images/prop2-7.jpg",
      "images/prop2-8.jpg",
      "images/prop2-9.jpg",
      "images/prop2-10.jpg",
      "images/prop2-11.jpg",
      "images/prop2-12.jpg",
      "images/prop2-13.jpg",
      "images/prop2-14.jpg",
      "images/prop2-15.jpg",
      "images/prop2-16.jpg",
      "images/prop2-17.jpg",
      "images/prop2-18.jpg",
      "images/prop2-19.jpg",
      "images/prop2-20.jpg",
    ],
  },

  // --- OSTALE NEKRETNINE (OSNOVNI PODACI ZA GRID) ---
  // --- PROPERTY 3: CITTÀ DI CASTELLO (FULL DETALJI) ---
  3: {
    title: "Casale dei Desideri: Luxury Farmhouse with Pool",
    location: "Umbria – Perugia – Città di Castello",
    lifestyle: "Country",
    type: "Country House",
    price: "€ 1.300.000",
    sqm: "740 m²",
    land: "8.630 m²",
    beds: "5",
    baths: "6",
    mainImg: "images/prop3-main.jpg",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"A magnificent restored stone farmhouse on the border between Umbria & Tuscany."</p>
            
            <p class="mb-4">Lying in a panoramic position between the Tiber valley and the hills of <strong>Città di Castello</strong>, this property offers an elegant flow throughout the home with finely furnished interiors.</p> 
            <p class="mb-6">Currently a private residence, the spacious 740 sqm layout is versatile and easily adaptable for use as a <strong>luxury holiday home or B&B guest accommodation</strong>.</p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Features & Amenities</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    
                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 14.5c-.5-2 1-3.5 2.5-3.5s2.5 1 2.5 3c0-2 1.5-3 2.5-3s2.5 1 2.5 3c0-2 1.5-3 2.5-3s2.5 1 2.5 3M4 18.5c-.5-2 1-3.5 2.5-3.5s2.5 1 2.5 3c0-2 1.5-3 2.5-3s2.5 1 2.5 3c0-2 1.5-3 2.5-3s2.5 1 2.5 3M18 5v6m3-6v6M4 6h10"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Panoramic Swimming Pool</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                        <span class="text-sm text-gray-600 font-light">8,630 m² Garden & 60 Olive Trees</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Radiators + Fireplace</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Internet Connection</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Restored Stone Farmhouse</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Ideal for Hospitality / B&B</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Panoramic Hill Views</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Energy Class: 161.9 kWh/m²</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Places of Interest</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Città di Castello</span>
                            <span class="text-sm text-gray-500 font-light">Nearest Town</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Cortona</span>
                            <span class="text-sm text-gray-500 font-light">40 km</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Arezzo</span>
                            <span class="text-sm text-gray-500 font-light">50 km</span>
                        </li>
                         <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia</span>
                            <span class="text-sm text-gray-500 font-light">55 km</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Florence</span>
                            <span class="text-sm text-gray-500 font-light">135 km</span>
                        </li>
                  </ul>
              </div>
        `,

    mapUrl: "http://googleusercontent.com/maps.google.com/5",

    gallery: [
      "images/prop3-1.jpg",
      "images/prop3-2.jpg",
      "images/prop3-3.jpg",
      "images/prop3-4.jpg",
      "images/prop3-5.jpg",
      "images/prop3-6.jpg",
      "images/prop3-7.jpg",
      "images/prop3-8.jpg",
      "images/prop3-9.jpg",
      "images/prop3-10.jpg",
      "images/prop3-11.jpg",
      "images/prop3-12.jpg",
      "images/prop3-13.jpg",
      "images/prop3-14.jpg",
      "images/prop3-15.jpg",
      "images/prop3-16.jpg",
      "images/prop3-17.jpg",
      "images/prop3-18.jpg",
      "images/prop3-19.jpg",
      "images/prop3-20.jpg",
    ],
  },
  // --- PROPERTY 4: LAKE TRASIMENO VILLA (FULL DETALJI) ---
  4: {
    title: "Luxury Turn-Key Villa with Lake View",
    location: "Umbria – Perugia – Passignano",
    lifestyle: "Lake and River",
    type: "Villa",
    price: "€ 2.980.000",
    sqm: "502 m²",
    land: "6.00 Ha",
    beds: "4",
    baths: "4",
    mainImg: "images/prop4-main.jpg",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"Recently completed turnkey stone villa commanding panoramic views over Lake Trasimeno."</p>
            
            <p class="mb-4">Situated in a commanding position overlooking <strong>Lake Trasimeno</strong>, this villa combines refined rural elegance with absolute modern comfort. The interiors feature high-end materials like travertine floors, oak parquet, and Carrara marble bathrooms.</p> 
            <p class="mb-6">The property guarantees absolute peace and privacy while being minutes from services. <strong>Approved projects</strong> for a swimming pool and a guesthouse are available, offering significant investment potential.</p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Features & Amenities</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    
                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Panoramic Lake Views</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Turn-key / New Condition</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 13a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 012-2h14zM16 13V9a2 2 0 00-2-2H9.992a2 2 0 00-1.992 2v4H16z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">103 m² Garage</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Approved Pool & Guest House</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Alarm, Cameras & Electric Gate</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                        <span class="text-sm text-gray-600 font-light">6.0 Hectares Private Land</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Energy Class A (28 kWh/m²)</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Travertine & Marble Finishes</span>
                    </div>

                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Places of Interest</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Passignano (Services)</span>
                            <span class="text-sm text-gray-500 font-light">4 km (5 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Cortona</span>
                            <span class="text-sm text-gray-500 font-light">26 km (30 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia</span>
                            <span class="text-sm text-gray-500 font-light">36 km (37 min)</span>
                        </li>
                         <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia Airport</span>
                            <span class="text-sm text-gray-500 font-light">41 km (35 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Florence</span>
                            <span class="text-sm text-gray-500 font-light">133 km (1h 45m)</span>
                        </li>
                  </ul>
              </div>
        `,

    mapUrl: "http://googleusercontent.com/maps.google.com/6",

    gallery: [
      "images/prop4-1.jpg",
      "images/prop4-2.jpg",
      "images/prop4-3.jpg",
      "images/prop4-4.jpg",
      "images/prop4-5.jpg",
      "images/prop4-6.jpg",
      "images/prop4-7.jpg",
      "images/prop4-8.jpg",
      "images/prop4-9.jpg",
      "images/prop4-10.jpg",
      "images/prop4-11.jpg",
      "images/prop4-12.jpg",
      "images/prop4-13.jpg",
      "images/prop4-14.jpg",
      "images/prop4-15.jpg",
      "images/prop4-16.jpg",
      "images/prop4-17.jpg",
      "images/prop4-18.jpg",
      "images/prop4-19.jpg",
      "images/prop4-20.jpg",
    ],
  },
  // --- PROPERTY 5: AMALFI COAST VILLA (FULL DETALJI) ---
  5: {
    title: "Sea-View Luxury Villa (Amalfi Coast)",
    location: "Campania – Salerno – Vietri sul Mare",
    lifestyle: "Seaside",
    type: "Villa",
    price: "€ 2.300.000",
    sqm: "173 m²",
    land: "786 m²",
    beds: "2",
    baths: "3",
    mainImg: "images/prop5-main.jpg",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"An architectural masterpiece perched on the cliffs of the Amalfi Coast."</p>
            
            <p class="mb-4">Designed in the 1950s by renowned architect <strong>Paolo Soleri</strong>, this luxury villa offers a unique blend of innovation and Mediterranean lifestyle. Located in <strong>Vietri sul Mare</strong>, the gateway to the Amalfi Coast, it sits in a spectacular panoramic position.</p> 
            <p class="mb-6">The property features two panoramic terraces—one in ceramic, one in wood—and a <strong>rooftop Jacuzzi</strong> overlooking the sea. A private path leads directly down to the beach.</p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Features & Amenities</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    
                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg> <span class="text-sm text-gray-600 font-light">Rooftop Sea-View Jacuzzi</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Designer: Paolo Soleri (1950s)</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Walking Access to Beach (10 min)</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Panoramic Sea Views</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                        <span class="text-sm text-gray-600 font-light">2 Large Panoramic Terraces</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Sold Fully Furnished</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Energy Class (138 kWh/m²)</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Convector Heating</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Places of Interest</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Vietri sul Mare</span>
                            <span class="text-sm text-gray-500 font-light">5 min walk</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Salerno</span>
                            <span class="text-sm text-gray-500 font-light">5 km</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Amalfi</span>
                            <span class="text-sm text-gray-500 font-light">20 km</span>
                        </li>
                         <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Positano</span>
                            <span class="text-sm text-gray-500 font-light">35 km</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Naples Airport</span>
                            <span class="text-sm text-gray-500 font-light">50 km</span>
                        </li>
                  </ul>
              </div>
        `,

    mapUrl: "http://googleusercontent.com/maps.google.com/7",

    gallery: [
      "images/prop5-1.jpg",
      "images/prop5-2.jpg",
      "images/prop5-3.jpg",
      "images/prop5-4.jpg",
      "images/prop5-5.jpg",
      "images/prop5-6.jpg",
      "images/prop5-7.jpg",
      "images/prop5-8.jpg",
      "images/prop5-9.jpg",
      "images/prop5-10.jpg",
      "images/prop5-11.jpg",
      "images/prop5-12.jpg",
      "images/prop5-13.jpg",
      "images/prop5-14.jpg",
      "images/prop5-15.jpg",
      "images/prop5-16.jpg",
      "images/prop5-17.jpg",
      "images/prop5-18.jpg",
      "images/prop5-19.jpg",
      "images/prop5-20.jpg",
    ],
  },
  // --- PROPERTY 6: VILLA AMEDEO (FULL DETALJI) ---
  6: {
    title: "Historic Villa with Wellness Center",
    location: "Tuscany – Arezzo – Loro Ciuffenna",
    lifestyle: "Country",
    type: "Hotel",
    price: "€ 2.250.000",
    sqm: "1.155 m²",
    land: "4.615 m²",
    beds: "15",
    baths: "17",
    mainImg: "images/prop6-main.jpg",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"A prestigious period villa offering a perfect combination of history, panoramic views & income potential."</p>
            
            <p class="mb-4">Located in the beautiful <strong>Valdarno hills</strong> between Arezzo and Florence, this fully renovated property is currently operating as a successful hospitality venue. It features a luxury wellness center, large communal spaces, and multiple independent apartments.</p> 
            <p class="mb-6">With a total capacity of <strong>51 beds</strong> and a complete spa facility (Jacuzzi, Turkish bath), this is an exceptional investment opportunity ready for immediate operation.</p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Features & Amenities</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    
                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> 
                        <span class="text-sm text-gray-600 font-light">Wellness Center (Jacuzzi & Turkish Bath)</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path></svg>
                        <span class="text-sm text-gray-600 font-light">15 Bedrooms / 51 Beds Total</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Multiple Independent Apartments</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 14.5c-.5-2 1-3.5 2.5-3.5s2.5 1 2.5 3c0-2 1.5-3 2.5-3s2.5 1 2.5 3c0-2 1.5-3 2.5-3s2.5 1 2.5 3M4 18.5c-.5-2 1-3.5 2.5-3.5s2.5 1 2.5 3c0-2 1.5-3 2.5-3s2.5 1 2.5 3c0-2 1.5-3 2.5-3s2.5 1 2.5 3M18 5v6m3-6v6M4 6h10"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Swimming Pool & Relaxation Area</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Dolby Surround Sound System</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Panoramic Valdarno Views</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Excellent Condition (Renovated)</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                        <span class="text-sm text-gray-600 font-light">4,615 m² Park & Garden</span>
                    </div>

                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Places of Interest</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Loro Ciuffenna</span>
                            <span class="text-sm text-gray-500 font-light">Local Town</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Arezzo</span>
                            <span class="text-sm text-gray-500 font-light">24 km</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Florence</span>
                            <span class="text-sm text-gray-500 font-light">70 km</span>
                        </li>
                         <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Florence Airport</span>
                            <span class="text-sm text-gray-500 font-light">~1h Drive</span>
                        </li>
                  </ul>
              </div>
        `,

    mapUrl: "http://googleusercontent.com/maps.google.com/8",

    gallery: [
      "images/prop6-1.jpg",
      "images/prop6-2.jpg",
      "images/prop6-3.jpg",
      "images/prop6-4.jpg",
      "images/prop6-5.jpg",
      "images/prop6-6.jpg",
      "images/prop6-7.jpg",
      "images/prop6-8.jpg",
      "images/prop6-9.jpg",
      "images/prop6-10.jpg",
      "images/prop6-11.jpg",
      "images/prop6-12.jpg",
      "images/prop6-13.jpg",
      "images/prop6-14.jpg",
      "images/prop6-15.jpg",
      "images/prop6-16.jpg",
      "images/prop6-17.jpg",
      "images/prop6-18.jpg",
      "images/prop6-19.jpg",
      "images/prop6-20.jpg",
    ],
  },

  7: {
    title: "Elegant Italian Villa with Pool & Guest Apartment",
    location: "Vasanello, Italy",
    lifestyle: "Country",
    type: "Villa",
    price: "€ 1.489.000",
    sqm: "600 m²",
    land: "300 m² terrace",
    beds: "9",
    baths: "8",
    mainImg: "images/prop7-main.jpg",

    // OPIS
    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"Elegance, comfort, and authentic Italian charm just a stone's throw from Rome."</p>
            <p class="mb-4">This distinguished family-run estate has long been a sought-after summer destination, historically generating €77,000–€86,000 in seasonal turnover and currently producing around €43,000 between May and September. Welcoming just nine discerning groups each year under a fixed long-term arrangement, the property offers exclusive weekly stays from €4,000 (€580 per night).
</p>
            <p class="mb-4">At the heart of the estate lies its most breathtaking feature: a magnificent dining hall set beneath a sweeping arch, seating more than 50 guests in grand style — the perfect setting for celebrations, weddings, and unforgettable gatherings.</p>
            <p class="mb-6">This villa near Rome combines elegance, comfort, and authentic Italian charm. Nestled among lush olive groves and wooded surroundings, it offers a serene setting that feels worlds away while remaining close to the city. The property is sold fully furnished and features four kitchens, including a large main kitchen with a dining area and direct access to a spacious 300 m² terrace, perfect for long meals and enjoyable moments with family and friends.
</p>
             <p class="mb-6">
On the property, you will find a dedicated wine cellar and a traditional wood-fired pizza oven, ideal for authentic Italian evenings. A large 12x6 m pool sits on a sunny terrace framed by olive trees and natural greenery, offering plenty of space for relaxation and social gatherings against a truly picturesque backdrop.</p>

            `,

    // FEATURES
    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Details & Distances</h3>
                <ul class="space-y-4">
                    <li class="flex justify-between border-b border-gray-100 pb-2">
                        <span class="text-sm text-gray-800 font-medium">Layout</span>
                        <span class="text-sm text-gray-500 font-light">3 floors, 15 sleeping places</span>
                    </li>
                    <li class="flex justify-between border-b border-gray-100 pb-2">
                        <span class="text-sm text-gray-800 font-medium">Amenities</span>
                        <span class="text-sm text-gray-500 font-light">12x6m Pool, Wine Cellar, Pizza Oven, 4 Kitchens</span>
                    </li>
                    <li class="flex justify-between border-b border-gray-100 pb-2">
                        <span class="text-sm text-gray-800 font-medium">Guest Apartment</span>
                        <span class="text-sm text-gray-500 font-light">50 m², 2 beds, full kitchen, A/C</span>
                    </li>
                    <li class="flex justify-between border-b border-gray-100 pb-2">
                        <span class="text-sm text-gray-800 font-medium">Town Centre</span>
                        <span class="text-sm text-gray-500 font-light">15 min walk</span>
                    </li>
                    <li class="flex justify-between border-b border-gray-100 pb-2">
                        <span class="text-sm text-gray-800 font-medium">Rome Airport</span>
                        <span class="text-sm text-gray-500 font-light">1h 15m Drive</span>
                    </li>
                    <li class="flex justify-between border-b border-gray-100 pb-2">
                        <span class="text-sm text-gray-800 font-medium">Central Rome</span>
                        <span class="text-sm text-gray-500 font-light">40 min by train</span>
                    </li>
                </ul>
            </div>
        `,

    mapUrl: "https://maps.google.com/maps?q=Vasanello,+Italy&output=embed",

    gallery: [
      "images/prop7-1.jpg",
      "images/prop7-2.jpg",
      "images/prop7-3.jpg",
      "images/prop7-4.jpeg",
      "images/prop7-5.jpeg",
      "images/prop7-6.jpeg",
      "images/prop7-7.jpeg",
      "images/prop7-8.jpeg",
      "images/prop7-9.jpeg",
      "images/prop7-10.jpeg",
      "images/prop7-11.jpeg",
      "images/prop7-12.jpeg",
      "images/prop7-13.jpeg",
      "images/prop7-14.jpeg",
      "images/prop7-15.jpeg",
      "images/prop7-16.jpeg",
      "images/prop7-17.jpeg",
      "images/prop7-18.jpeg",
      "images/prop7-19.jpeg",
    ],
  },

  // --- PROPERTY 8: CAPRAIA WINE ESTATE ---
  9: {
    title: "Restored Farmhouse with 13th-Century Church",
    location: "Umbria \u2013 Perugia \u2013 Umbertide",
    lifestyle: "Country",
    type: "Country House",
    price: "\u20ac 4.150.000",
    sqm: "474 m\u00b2",
    land: "3.77 Ha",
    beds: "8",
    baths: "8",
    mainImg: "images/prop9-main.jpg",
    mapUrl:
      "https://www.google.com/maps?q=Umbertide%2C+Perugia%2C+Italy&z=11&output=embed",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"The nave is the drawing room. The sacristy is where you eat."</p>
            <p class="mb-4">In an unspoiled valley between <strong>Umbertide</strong> and <strong>Perugia</strong>, open to fields and vineyards on every side, a restored farmhouse and a <strong>13th-century church</strong> stand together. The property already runs as tourist accommodation, and does so well; it also lends itself to weddings.</p>
            <p class="mb-4">The church, 134 m&sup2; and long deconsecrated, has been renovated without being tidied away &mdash; the stone walls are intact and the wooden roof trusses perfectly preserved. The nave is now a single large living room, and the former sacristy holds the dining room, the kitchen and two service bathrooms.</p>
            <p class="mb-4">The farmhouse alongside runs to 340 m&sup2; over two floors. Downstairs: the entrance, a laundry, three bedrooms with private bathrooms and one smaller room. Upstairs, a central television room opens onto three more en-suite bedrooms and another small room. <strong>Eight bedrooms in total</strong>, eight bathrooms.</p>
            <p class="mb-6">A garden of 5,300 m&sup2; surrounds the buildings. An olive-lined path leads to the <strong>15 &times; 6 m pool</strong> and its stone solarium, with room enough around it for a long dinner. Beyond that the land carries hazelnuts, five varieties of oak, and a <strong>truffle ground of 1,170 plants</strong>. The Antognolla Golf Club is minutes away.</p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">The Property</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Deconsecrated 13th-century church, 134 m&sup2;</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Farmhouse of 340 m&sup2; over two floors</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Swimming pool, 15 &times; 6 m, with stone solarium</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Truffle ground of 1,170 plants</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Hazelnut and five varieties of oak</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Garden of 5,300 m&sup2;</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Private well</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Minutes from Antognolla Golf Club</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Airports</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia San Francesco</span>
                            <span class="text-sm text-gray-500 font-light">24 km (25 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Ancona R. Sanzio</span>
                            <span class="text-sm text-gray-500 font-light">127 km (1 h 30 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Firenze Vespucci</span>
                            <span class="text-sm text-gray-500 font-light">173 km (2 h)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Roma Ciampino</span>
                            <span class="text-sm text-gray-500 font-light">206 km (2 h 35 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Roma Fiumicino</span>
                            <span class="text-sm text-gray-500 font-light">220 km (2 h 30 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Pisa G. Galilei</span>
                            <span class="text-sm text-gray-500 font-light">233 km (2 h 40 min)</span>
                        </li>
                  </ul>
            </div>
        `,

    gallery: [
      "images/prop9-1.jpg",
      "images/prop9-2.jpg",
      "images/prop9-3.jpg",
      "images/prop9-4.jpg",
      "images/prop9-5.jpg",
      "images/prop9-6.jpg",
      "images/prop9-7.jpg",
      "images/prop9-8.jpg",
      "images/prop9-9.jpg",
      "images/prop9-10.jpg",
      "images/prop9-11.jpg",
      "images/prop9-12.jpg",
      "images/prop9-13.jpg",
      "images/prop9-14.jpg",
      "images/prop9-15.jpg",
      "images/prop9-16.jpg",
      "images/prop9-17.jpg",
      "images/prop9-18.jpg",
      "images/prop9-19.jpg",
      "images/prop9-20.jpg",
    ],
  },
  10: {
    title: "Panoramic Estate in the Niccone Valley",
    location: "Umbria \u2013 Perugia \u2013 Lisciano Niccone",
    lifestyle: "Rural Hamlet",
    type: "Villa",
    price: "\u20ac 6.800.000",
    sqm: "1.162 m\u00b2",
    land: "18.23 Ha",
    beds: "7",
    baths: "11",
    mainImg: "images/prop10-main.jpg",
    mapUrl:
      "https://www.google.com/maps?q=Lisciano+Niccone%2C+Perugia%2C+Italy&z=11&output=embed",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"Four years, local stonemasons, and salvaged materials. Nothing here is off the shelf."</p>
            <p class="mb-4">In the <strong>Niccone Valley</strong>, on the border between Umbria and Tuscany and close to the Reschio Estate, this estate stands in more than <strong>18 hectares</strong> of maintained grounds, a short drive from Cortona and Lake Trasimeno.</p>
            <p class="mb-4">It began as the ruins of a farmhouse. The present owner spent four years rebuilding it with local craftsmen, stonemasons and artists, choosing materials from salvage yards rather than catalogues. Traditional Umbrian building meets underfloor heating and double glazing throughout.</p>
            <p class="mb-4">The <strong>main villa</strong> of 470 m&sup2; runs over three levels, entered through a vaulted stone portal. A 56 m&sup2; kitchen and dining room, fitted with Wolf and Sub-Zero, opens onto a wisteria-covered terrace. The master suite occupies the tower &mdash; 70 m&sup2;, its own terrace, and a bathroom lined in honey travertine. Below are a gym with Turkish bath and a stone-vaulted cellar, and a vaulted tunnel out to the pool.</p>
            <p class="mb-4">Three more buildings stand alongside: a <strong>guesthouse</strong> of 90 m&sup2; with two independent bedrooms, a stone <strong>farmhouse</strong> of 382 m&sup2; with an 80 m&sup2; open-plan living space and a second pool on its roof terrace, and a new <strong>agricultural building</strong> of 220 m&sup2; for staff.</p>
            <p class="mb-6">Outside: 300 olive trees in production, rose gardens and jasmine-covered walls, a synthetic tennis court, four private wells and an artificial lake feeding the irrigation. Two independent entrances and three electric gates. The farm machinery and most of the outdoor furniture are included in the sale.</p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">The Estate</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Four buildings across 18.23 ha</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Pool 17 &times; 7 m, salt chlorinated, electric cover</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Second pool, 6 &times; 6 m, on the farmhouse roof terrace</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Professional synthetic tennis court</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">300 olive trees in production, 2.27 ha</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Gym with Turkish bath, and a vaulted cellar</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Four private wells and an artificial lake</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Two entrances, three electric gates, security system</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">The Buildings</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Main villa</span>
                            <span class="text-sm text-gray-500 font-light">470 m&sup2; &middot; 2 bed &middot; 4 bath</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Guesthouse</span>
                            <span class="text-sm text-gray-500 font-light">90 m&sup2; &middot; 2 bed &middot; 2 bath</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Farmhouse</span>
                            <span class="text-sm text-gray-500 font-light">382 m&sup2; &middot; 3 bed &middot; 3 bath</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Agricultural building</span>
                            <span class="text-sm text-gray-500 font-light">220 m&sup2; &middot; staff quarters</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Nearby</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Town with services</span>
                            <span class="text-sm text-gray-500 font-light">3 km (5 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Tuoro sul Trasimeno</span>
                            <span class="text-sm text-gray-500 font-light">15 km (20 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Umbertide</span>
                            <span class="text-sm text-gray-500 font-light">19 km (20 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Cortona</span>
                            <span class="text-sm text-gray-500 font-light">23 km (25 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Citt&agrave; di Castello</span>
                            <span class="text-sm text-gray-500 font-light">36 km (30 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia</span>
                            <span class="text-sm text-gray-500 font-light">41 km (50 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Arezzo</span>
                            <span class="text-sm text-gray-500 font-light">51 km (1 h)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Siena</span>
                            <span class="text-sm text-gray-500 font-light">93 km (1 h 20 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Florence</span>
                            <span class="text-sm text-gray-500 font-light">143 km (2 h)</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Airports</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia San Francesco</span>
                            <span class="text-sm text-gray-500 font-light">51 km (45 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Ancona R. Sanzio</span>
                            <span class="text-sm text-gray-500 font-light">153 km (1 h 50 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Firenze Vespucci</span>
                            <span class="text-sm text-gray-500 font-light">154 km (1 h 55 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Pisa G. Galilei</span>
                            <span class="text-sm text-gray-500 font-light">214 km (2 h 35 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Bologna G. Marconi</span>
                            <span class="text-sm text-gray-500 font-light">224 km (2 h 45 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Roma Fiumicino</span>
                            <span class="text-sm text-gray-500 font-light">250 km (2 h 40 min)</span>
                        </li>
                  </ul>
            </div>
        `,

    gallery: [
      "images/prop10-1.jpg",
      "images/prop10-2.jpg",
      "images/prop10-3.jpg",
      "images/prop10-4.jpg",
      "images/prop10-5.jpg",
      "images/prop10-6.jpg",
      "images/prop10-7.jpg",
      "images/prop10-8.jpg",
      "images/prop10-9.jpg",
      "images/prop10-10.jpg",
      "images/prop10-11.jpg",
      "images/prop10-12.jpg",
      "images/prop10-13.jpg",
      "images/prop10-14.jpg",
      "images/prop10-15.jpg",
      "images/prop10-16.jpg",
      "images/prop10-17.jpg",
      "images/prop10-18.jpg",
      "images/prop10-19.jpg",
      "images/prop10-20.jpg",
    ],
  },
  11: {
    title: "Riverside Estate with Infinity Pool",
    location: "Tuscany \u2013 Pisa \u2013 Volterra",
    lifestyle: "Country",
    type: "Country House",
    price: "\u20ac 3.500.000",
    sqm: "1.160 m\u00b2",
    land: "98.49 Ha",
    beds: "5",
    baths: "6",
    mainImg: "images/prop11-main.jpg",
    mapUrl:
      "https://www.google.com/maps?q=Volterra%2C+Pisa%2C+Italy&z=11&output=embed",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"Ninety-eight hectares along a river, and an A energy rating in a stone farmhouse."</p>
            <p class="mb-4">In the Pisan hills along a river, not far from the medieval town of <strong>Volterra</strong>, an estate of <strong>98.5 hectares</strong> with a country villa and olive grove. The present owners renovated it in <strong>2018</strong>.</p>
            <p class="mb-4">The villa runs to 875 m&sup2; in stone and brick, wholly rebuilt and consolidated. The ground floor opens to the garden through tall windows: an entrance hall with the lift, a large living and dining room, an eat-in kitchen with pantry, a vaulted room that would make a good music room, two en-suite bedrooms, a study, a workshop and a laundry. Upstairs, a sitting room and three more en-suite bedrooms.</p>
            <p class="mb-4">The north wing is left in builder&rsquo;s finish &mdash; <strong>seven rooms</strong> with the fittings still to install, enough for a second wing of bedrooms and bathrooms if you want them.</p>
            <p class="mb-4">What is unusual here is the engineering. A lift between floors, home automation, underfloor heating on a heat pump, photovoltaic panels, and the thickness of the old walls put to work: the result is an <strong>A energy rating at 26.19 kWh/m&sup2;</strong>, which is rare in a building of this age.</p>
            <p class="mb-6">The garden holds the <strong>20 &times; 5 m infinity pool</strong> and <strong>600 olive trees</strong> across 2.52 hectares, pressing around 650 kg a year. A 270 m&sup2; depot houses the machinery, with a small outbuilding for plant.</p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">The Estate</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">98.49 ha of land along a river</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Infinity pool, 20 &times; 5 m</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">600 olive trees, 2.52 ha, 650 kg a year</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Lift between both floors</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Underfloor heating on a heat pump</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Photovoltaic system and home automation</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Energy rating A &mdash; 26.19 kWh/m&sup2; a year</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Seven further rooms ready to be finished</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">The Buildings</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Villa</span>
                            <span class="text-sm text-gray-500 font-light">875 m&sup2; &middot; 5 bed &middot; 6 bath</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Depot</span>
                            <span class="text-sm text-gray-500 font-light">270 m&sup2; &middot; machinery and vehicles</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Outbuilding</span>
                            <span class="text-sm text-gray-500 font-light">15 m&sup2; &middot; plant and storage</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Nearby</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Volterra</span>
                            <span class="text-sm text-gray-500 font-light">13 km (25 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Pomarance</span>
                            <span class="text-sm text-gray-500 font-light">20 km (35 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Colle di Val d&rsquo;Elsa</span>
                            <span class="text-sm text-gray-500 font-light">32 km (45 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">San Gimignano</span>
                            <span class="text-sm text-gray-500 font-light">33 km (45 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Bolgheri</span>
                            <span class="text-sm text-gray-500 font-light">44 km (1 h)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Siena</span>
                            <span class="text-sm text-gray-500 font-light">59 km (1 h 10 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Pisa</span>
                            <span class="text-sm text-gray-500 font-light">76 km (1 h 25 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Florence</span>
                            <span class="text-sm text-gray-500 font-light">87 km (1 h 40 min)</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Airports</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Pisa G. Galilei</span>
                            <span class="text-sm text-gray-500 font-light">73 km (1 h 15 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Firenze Vespucci</span>
                            <span class="text-sm text-gray-500 font-light">93 km (1 h 30 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Bologna G. Marconi</span>
                            <span class="text-sm text-gray-500 font-light">175 km (2 h 25 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Genova C. Colombo</span>
                            <span class="text-sm text-gray-500 font-light">245 km (3 h 10 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Roma Fiumicino</span>
                            <span class="text-sm text-gray-500 font-light">316 km (3 h 40 min)</span>
                        </li>
                  </ul>
            </div>
        `,

    gallery: [
      "images/prop11-1.jpg",
      "images/prop11-2.jpg",
      "images/prop11-3.jpg",
      "images/prop11-4.jpg",
      "images/prop11-5.jpg",
      "images/prop11-6.jpg",
      "images/prop11-7.jpg",
      "images/prop11-8.jpg",
      "images/prop11-9.jpg",
      "images/prop11-10.jpg",
      "images/prop11-11.jpg",
      "images/prop11-12.jpg",
      "images/prop11-13.jpg",
      "images/prop11-14.jpg",
      "images/prop11-15.jpg",
      "images/prop11-16.jpg",
      "images/prop11-17.jpg",
      "images/prop11-18.jpg",
      "images/prop11-19.jpg",
      "images/prop11-20.jpg",
    ],
  },
  12: {
    title: "Chianti Classico Farmhouse with Hobby Vineyard",
    location: "Tuscany \u2013 Siena \u2013 Gaiole in Chianti",
    lifestyle: "Country",
    type: "Country House",
    price: "\u20ac 3.850.000",
    sqm: "431 m\u00b2",
    land: "6.82 Ha",
    beds: "4",
    baths: "4",
    mainImg: "images/prop12-main.jpg",
    mapUrl:
      "https://www.google.com/maps?q=Gaiole+in+Chianti%2C+Siena%2C+Italy&z=11&output=embed",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"Turnkey in the literal sense &mdash; furnished, finished, and quiet."</p>
            <p class="mb-4">In the hills of <strong>Chianti Classico</strong>, a few kilometres from <strong>Gaiole</strong>, a farmhouse restored to a standard that is uncommon even here. It is sold <strong>fully furnished</strong> and is genuinely ready to move into; the private, quiet position is much of the point.</p>
            <p class="mb-4">The 431 m&sup2; of living space is split between two adjacent buildings that work together or entirely apart &mdash; which also makes a rental arrangement straightforward if that interests you.</p>
            <p class="mb-4">The <strong>farmhouse</strong> of 252 m&sup2; runs over three connected levels. A kitchen with fireplace opens to a dining room set slightly below it; a hallway leads to the first en-suite bedroom, the laundry and an underground cellar. Up the stairs from the kitchen: a living room with veranda and the second en-suite bedroom.</p>
            <p class="mb-4">The <strong>dependance</strong> of 179 m&sup2; holds a self-contained apartment on its upper floor &mdash; large living room with open kitchen, paved patio, bedroom and bathroom &mdash; suited to guests or a house manager. The lower floor is storage today and would take a gym and spa without difficulty.</p>
            <p class="mb-6">The garden of 6,115 m&sup2; is landscaped in detail around a <strong>14 &times; 7 m infinity pool</strong>. Beyond it, 6.2 hectares: a mature olive grove of 1.5 ha, a <strong>580 m&sup2; hobby vineyard</strong>, a little arable land, and 4.2 hectares of woodland that keep the place to itself.</p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">The Property</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Sold fully furnished, ready to move into</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Infinity pool, 14 &times; 7 m</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Landscaped garden of 6,115 m&sup2;</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Mature olive grove, 1.5 ha</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Hobby vineyard of 580 m&sup2; in Chianti Classico</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">4.2 ha of woodland for privacy</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Two buildings, usable together or apart</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Artesian well, underfloor heating</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">The Buildings</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Farmhouse</span>
                            <span class="text-sm text-gray-500 font-light">252 m&sup2; &middot; 2 bed &middot; 2 bath</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Dependance</span>
                            <span class="text-sm text-gray-500 font-light">179 m&sup2; &middot; 1 bed &middot; 1 bath</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Nearby</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Ambra</span>
                            <span class="text-sm text-gray-500 font-light">14 km (25 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Gaiole in Chianti</span>
                            <span class="text-sm text-gray-500 font-light">16 km (30 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Castelnuovo Berardenga</span>
                            <span class="text-sm text-gray-500 font-light">18 km (30 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Castellina in Chianti</span>
                            <span class="text-sm text-gray-500 font-light">35 km (50 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Siena</span>
                            <span class="text-sm text-gray-500 font-light">39 km (45 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Arezzo</span>
                            <span class="text-sm text-gray-500 font-light">47 km (1 h)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Florence</span>
                            <span class="text-sm text-gray-500 font-light">74 km (1 h 30 min)</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Airports</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Firenze Vespucci</span>
                            <span class="text-sm text-gray-500 font-light">85 km (1 h 20 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia San Francesco</span>
                            <span class="text-sm text-gray-500 font-light">109 km (1 h 25 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Pisa G. Galilei</span>
                            <span class="text-sm text-gray-500 font-light">146 km (2 h)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Bologna G. Marconi</span>
                            <span class="text-sm text-gray-500 font-light">167 km (2 h 20 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Roma Fiumicino</span>
                            <span class="text-sm text-gray-500 font-light">252 km (2 h 35 min)</span>
                        </li>
                  </ul>
            </div>
        `,

    gallery: [
      "images/prop12-1.jpg",
      "images/prop12-2.jpg",
      "images/prop12-3.jpg",
      "images/prop12-4.jpg",
      "images/prop12-5.jpg",
      "images/prop12-6.jpg",
      "images/prop12-7.jpg",
      "images/prop12-8.jpg",
      "images/prop12-9.jpg",
      "images/prop12-10.jpg",
      "images/prop12-11.jpg",
      "images/prop12-12.jpg",
      "images/prop12-13.jpg",
      "images/prop12-14.jpg",
      "images/prop12-15.jpg",
      "images/prop12-16.jpg",
      "images/prop12-17.jpg",
      "images/prop12-18.jpg",
      "images/prop12-19.jpg",
      "images/prop12-20.jpg",
    ],
  },
  13: {
    title: "Medieval Castle with 77 Hectares",
    location: "Umbria \u2013 Perugia \u2013 Marsciano",
    lifestyle: "Country",
    type: "Castle",
    price: "\u20ac 2.500.000",
    sqm: "2.093 m\u00b2",
    land: "77.57 Ha",
    beds: "11",
    baths: "7",
    mainImg: "images/prop13-main.jpg",
    mapUrl:
      "https://www.google.com/maps?q=Marsciano%2C+Perugia%2C+Italy&z=11&output=embed",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"Founded at the end of the 10th century and lived in ever since."</p>
            <p class="mb-4">A few kilometres from <strong>Perugia</strong>, a castle on its own hill with an estate of <strong>77 hectares</strong> running down to the valley. Its origins are late 10th century and it has been continuously inhabited since &mdash; not a ruin, and not a restoration project standing empty.</p>
            <p class="mb-4">The castle itself is 1,500 m&sup2; over five levels, under a <strong>13th-century tower</strong> that still has its wall walkway and original battlements. Four reception salons on the ground floor; a kitchen with fireplace, dining room, study and five bedrooms on the first, alongside a 60 m&sup2; panoramic terrace; a self-contained guest apartment on the second, with access to the tower and the walls; a trussed attic above.</p>
            <p class="mb-4">There are <strong>over fifty rooms</strong>. Vaulted ceilings, handmade terracotta floors, and carved stone fireplaces bearing heraldic arms. The basement holds <strong>Etruscan relics</strong>, which says something about how long this hill has been occupied.</p>
            <p class="mb-4">Two further buildings come with it: a <strong>rustic farmhouse</strong> of 450 m&sup2; to be restored, which would make an independent villa facing the castle, and an old <strong>tobacco drying barn</strong> of 143 m&sup2; whose volume could be rebuilt.</p>
            <p class="mb-6">The land is genuinely agricultural &mdash; 48.8 hectares under cultivation, 1.8 of pasture, olive groves, woods and a truffle ground, with the Nestore river along the boundary supplying irrigation. The walled formal garden would take restoring, and lends itself to events.</p>
            <p class="text-sm text-gray-500 font-light border-t border-gray-200 pt-6">
              Offered in its present condition. The castle is habitable and lived in;
              the farmhouse and the barn require restoration, and the formal garden
              has been let go. Priced accordingly.
            </p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">The Estate</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Origins in the late 10th century</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">13th-century tower with wall walkway and battlements</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Over fifty rooms across five levels</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Panoramic terrace of 60 m&sup2;</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">48.8 ha of cultivated land, 1.8 ha of pasture</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Bordered by the Nestore river</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Truffle ground and 2 ha of olive grove</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Walled formal garden, suited to events</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">The Buildings</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Castle</span>
                            <span class="text-sm text-gray-500 font-light">1,500 m&sup2; &middot; 8 bed &middot; 6 bath</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Farmhouse</span>
                            <span class="text-sm text-gray-500 font-light">450 m&sup2; &middot; 3 bed &middot; 1 bath &middot; to restore</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Tobacco barn</span>
                            <span class="text-sm text-gray-500 font-light">143 m&sup2; &middot; unused</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Nearby</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Closest services</span>
                            <span class="text-sm text-gray-500 font-light">2 km (5 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Marsciano</span>
                            <span class="text-sm text-gray-500 font-light">12 km (15 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Deruta</span>
                            <span class="text-sm text-gray-500 font-light">20 km (25 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia</span>
                            <span class="text-sm text-gray-500 font-light">25 km (30 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Todi</span>
                            <span class="text-sm text-gray-500 font-light">35 km (35 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Assisi</span>
                            <span class="text-sm text-gray-500 font-light">50 km (50 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Orvieto</span>
                            <span class="text-sm text-gray-500 font-light">75 km (1 h)</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Airports</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia San Francesco</span>
                            <span class="text-sm text-gray-500 font-light">35 km (35 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Ancona R. Sanzio</span>
                            <span class="text-sm text-gray-500 font-light">150 km (2 h)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Roma Ciampino</span>
                            <span class="text-sm text-gray-500 font-light">175 km (2 h 10 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Firenze Vespucci</span>
                            <span class="text-sm text-gray-500 font-light">185 km (2 h 25 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Roma Fiumicino</span>
                            <span class="text-sm text-gray-500 font-light">190 km (2 h 20 min)</span>
                        </li>
                  </ul>
            </div>
        `,

    gallery: [
      "images/prop13-1.jpg",
      "images/prop13-2.jpg",
      "images/prop13-3.jpg",
      "images/prop13-4.jpg",
      "images/prop13-5.jpg",
      "images/prop13-6.jpg",
      "images/prop13-7.jpg",
      "images/prop13-8.jpg",
      "images/prop13-9.jpg",
      "images/prop13-10.jpg",
      "images/prop13-11.jpg",
      "images/prop13-12.jpg",
      "images/prop13-13.jpg",
      "images/prop13-14.jpg",
      "images/prop13-15.jpg",
      "images/prop13-16.jpg",
      "images/prop13-17.jpg",
      "images/prop13-18.jpg",
      "images/prop13-19.jpg",
      "images/prop13-20.jpg",
    ],
  },
  14: {
    title: "Restored Hamlet and Boutique Hotel in Mugello",
    location: "Tuscany \u2013 Florence \u2013 Mugello",
    lifestyle: "Rural Hamlet",
    type: "Hotel",
    price: "\u20ac 4.900.000",
    sqm: "1.520 m\u00b2",
    land: "4.44 Ha",
    beds: "14",
    baths: "17",
    mainImg: "images/prop14-main.jpg",
    mapUrl:
      "https://www.google.com/maps?q=Mugello%2C+Florence%2C+Italy&z=11&output=embed",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"An abandoned rural settlement, restored building by building, now taking guests."</p>
            <p class="mb-4">In the <strong>Mugello Valley</strong>, less than an hour north of Florence, a <strong>hamlet</strong> put back together from an old rural settlement and running today as a hospitality business.</p>
            <p class="mb-4">It is not one house but <strong>several buildings</strong>, each holding independent guest units &mdash; living rooms with their own kitchens, bedrooms and bathrooms, so a party can take a unit and keep to itself. Fourteen bedrooms and seventeen bathrooms across the complex.</p>
            <p class="mb-4">The restoration kept the traditional Tuscan building &mdash; stone, render and terracotta &mdash; and put unremarkable comfort inside it. The <strong>wellness area</strong> has a jacuzzi, sauna, Turkish bath and a relaxation room, and there is a swimming pool in the grounds.</p>
            <p class="mb-6">The energy rating is <strong>A, at 32.62 kWh/m&sup2;</strong>, which for a restored rural hamlet is worth noting: running costs on 1,520 m&sup2; are what make or break a small hotel.</p>
            <p class="text-sm text-gray-500 font-light border-t border-gray-200 pt-6">
              Sold as a trading hospitality business. Occupancy, accounts and
              any forward bookings are available on request.
            </p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">The Property</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Several buildings, independent guest units</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">14 bedrooms and 17 bathrooms</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Wellness area: jacuzzi, sauna, Turkish bath</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Swimming pool</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">4.44 ha of grounds</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Energy rating A &mdash; 32.62 kWh/m&sup2; a year</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Trading as a hospitality business</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">38 km from Florence</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Nearby</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Closest services</span>
                            <span class="text-sm text-gray-500 font-light">2 km (5 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Florence</span>
                            <span class="text-sm text-gray-500 font-light">38 km (55 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Arezzo</span>
                            <span class="text-sm text-gray-500 font-light">84 km (1 h 20 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">San Gimignano</span>
                            <span class="text-sm text-gray-500 font-light">88 km (1 h 35 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Siena</span>
                            <span class="text-sm text-gray-500 font-light">110 km (1 h 50 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Montepulciano</span>
                            <span class="text-sm text-gray-500 font-light">117 km (1 h 45 min)</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Airports</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Firenze Vespucci</span>
                            <span class="text-sm text-gray-500 font-light">63 km (1 h 5 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Bologna Marconi</span>
                            <span class="text-sm text-gray-500 font-light">105 km (1 h 30 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Pisa Galilei</span>
                            <span class="text-sm text-gray-500 font-light">123 km (1 h 45 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia San Francesco</span>
                            <span class="text-sm text-gray-500 font-light">167 km (2 h 5 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Roma Fiumicino</span>
                            <span class="text-sm text-gray-500 font-light">310 km (3 h 15 min)</span>
                        </li>
                  </ul>
            </div>
        `,

    gallery: [
      "images/prop14-1.jpg",
      "images/prop14-2.jpg",
      "images/prop14-3.jpg",
      "images/prop14-4.jpg",
      "images/prop14-5.jpg",
      "images/prop14-6.jpg",
      "images/prop14-7.jpg",
      "images/prop14-8.jpg",
      "images/prop14-9.jpg",
      "images/prop14-10.jpg",
      "images/prop14-11.jpg",
      "images/prop14-12.jpg",
      "images/prop14-13.jpg",
      "images/prop14-14.jpg",
      "images/prop14-15.jpg",
      "images/prop14-16.jpg",
      "images/prop14-17.jpg",
      "images/prop14-18.jpg",
      "images/prop14-19.jpg",
      "images/prop14-20.jpg",
    ],
  },
  15: {
    title: "Villa Policiano with Pool near Montepulciano",
    location: "Tuscany \u2013 Siena \u2013 Montepulciano",
    lifestyle: "Country",
    type: "Villa",
    price: "Price on request",
    sqm: "279 m\u00b2",
    land: "3.280 m\u00b2",
    beds: "6",
    baths: "4",
    mainImg: "images/prop15-main.jpg",
    mapUrl:
      "https://www.google.com/maps?q=Montepulciano%2C+Siena%2C+Italy&z=11&output=embed",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"A cypress drive, a brick facade under climbing plants, and Montepulciano on the skyline."</p>
            <p class="mb-4">Between the <strong>Valdichiana</strong> and the <strong>Val d&rsquo;Orcia</strong>, a short drive from <strong>Montepulciano</strong> and Torrita di Siena, this villa is reached along a classic cypress-lined drive. Climbing plants cover part of the brick front.</p>
            <p class="mb-4">The house is 279 m&sup2; over four levels. The basement holds the old cellars under vaulted ceilings &mdash; service rooms, or whatever you decide. A double staircase leads to the ground floor: kitchen and dining room, a bright living room, two bedrooms and two bathrooms.</p>
            <p class="mb-4">The first floor repeats the pattern with its own entrance &mdash; a second kitchen and dining room, a modern fireplace dividing dining from living, two more bedrooms, a study, a bathroom and a small terrace. The attic above would take <strong>two further bedrooms and a bathroom</strong>.</p>
            <p class="mb-4">That layout, with <strong>double access to every floor</strong>, is the point: the villa divides into independent apartments without structural work, which makes it as workable as a bed and breakfast or small hotel as it is as one house.</p>
            <p class="mb-6">Heating and cooling run on a modern heat pump, with a <strong>photovoltaic system</strong> cutting consumption further. The 3,280 m&sup2; garden holds a <strong>14 &times; 4 m pool</strong> with a sunbathing area and a gazebo.</p>
            <p class="text-sm text-gray-500 font-light border-t border-gray-200 pt-6">
              Price on request. Ask us and we will come back with the current
              figure and what is included.
            </p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">The Property</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Cypress-lined driveway</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Swimming pool, 14 &times; 4 m, with gazebo</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Garden of 3,280 m&sup2;</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Heat pump heating and cooling</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Photovoltaic system</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Vaulted cellars in the basement</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Double access to each floor</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">5 km from Montepulciano</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Nearby</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Closest services</span>
                            <span class="text-sm text-gray-500 font-light">2 km (2 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Montepulciano</span>
                            <span class="text-sm text-gray-500 font-light">5 km (10 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Pienza</span>
                            <span class="text-sm text-gray-500 font-light">20 km (25 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Cortona</span>
                            <span class="text-sm text-gray-500 font-light">30 km (35 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Montalcino</span>
                            <span class="text-sm text-gray-500 font-light">40 km (45 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Siena</span>
                            <span class="text-sm text-gray-500 font-light">60 km (50 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Florence</span>
                            <span class="text-sm text-gray-500 font-light">100 km (1 h 15 min)</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Airports</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia San Francesco</span>
                            <span class="text-sm text-gray-500 font-light">70 km (1 h)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Firenze Vespucci</span>
                            <span class="text-sm text-gray-500 font-light">120 km (1 h 15 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Pisa G. Galilei</span>
                            <span class="text-sm text-gray-500 font-light">180 km (2 h 10 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Bologna G. Marconi</span>
                            <span class="text-sm text-gray-500 font-light">205 km (2 h)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Roma Fiumicino</span>
                            <span class="text-sm text-gray-500 font-light">220 km (2 h 10 min)</span>
                        </li>
                  </ul>
            </div>
        `,

    gallery: [
      "images/prop15-1.jpg",
      "images/prop15-2.jpg",
      "images/prop15-3.jpg",
      "images/prop15-4.jpg",
      "images/prop15-5.jpg",
      "images/prop15-6.jpg",
      "images/prop15-7.jpg",
      "images/prop15-8.jpg",
      "images/prop15-9.jpg",
      "images/prop15-10.jpg",
      "images/prop15-11.jpg",
      "images/prop15-12.jpg",
      "images/prop15-13.jpg",
      "images/prop15-14.jpg",
      "images/prop15-15.jpg",
      "images/prop15-16.jpg",
      "images/prop15-17.jpg",
      "images/prop15-18.jpg",
      "images/prop15-19.jpg",
      "images/prop15-20.jpg",
    ],
  },
  16: {
    title: "Modern Villa with Infinity Pool near Assisi",
    location: "Umbria \u2013 Perugia \u2013 Assisi",
    lifestyle: "Country",
    type: "Villa",
    price: "\u20ac 1.980.000",
    sqm: "466 m\u00b2",
    land: "1.72 Ha",
    beds: "5",
    baths: "6",
    mainImg: "images/prop16-main.jpg",
    mapUrl:
      "https://www.google.com/maps?q=Assisi%2C+Perugia%2C+Italy&z=11&output=embed",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"A modern house in Assisi, which is harder to find than an old one."</p>
            <p class="mb-4">Looking out over the Umbrian valley a short drive from the historic centre of <strong>Assisi</strong>, a <strong>modern villa</strong> built to current standards rather than restored into them &mdash; the reason it reaches <strong>energy class B</strong> where most houses in this landscape cannot.</p>
            <p class="mb-4">The main house is 335 m&sup2;. Large windows and pale walls carry light through the living rooms, which are close to minimal: travertine floors, spare furniture, a kitchen and a living-dining room each with a fireplace and a porch beyond. The ground floor also holds an office, a hobby room, a <strong>gym and wellness room</strong>, and a double garage of 74 m&sup2;. Upstairs, the master suite with its own dressing room, and two further double bedrooms.</p>
            <p class="mb-4">The <strong>guesthouse</strong> of 107 m&sup2; stands beside it &mdash; two bedrooms, two bathrooms, an open-plan living room with kitchen, and a porch. It joins the main house across the first-floor terrace but has its own entrance, so guests need not come through your hall.</p>
            <p class="mb-4">An old oven nearby carries permitted volume for a further <strong>24 m&sup2; dependance</strong> with a greenhouse, which would make a second income unit or caretaker's quarters.</p>
            <p class="mb-6">The garden holds a <strong>panoramic infinity pool with a lagoon shallow</strong>, and 1.42 hectares of olives climb the slope behind. Perugia airport is ten minutes away.</p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">The Property</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Infinity pool with lagoon shallow</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Gym and wellness room</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Double garage of 74 m&sup2;</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">1.42 ha olive grove</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Energy class B, 92.87 kWh/m&sup2;</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Underfloor heating and air conditioning</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Guesthouse with independent access</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">8 km from Assisi, 8 km from Perugia airport</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">The Buildings</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Villa</span>
                            <span class="text-sm text-gray-500 font-light">335 m&sup2; &middot; 3 bed &middot; 4 bath</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Guesthouse</span>
                            <span class="text-sm text-gray-500 font-light">107 m&sup2; &middot; 2 bed &middot; 2 bath</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Dependance</span>
                            <span class="text-sm text-gray-500 font-light">24 m&sup2; &middot; permitted volume, to build</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Nearby</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Closest services</span>
                            <span class="text-sm text-gray-500 font-light">1 km (2 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Bastia Umbra</span>
                            <span class="text-sm text-gray-500 font-light">4 km (5 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Assisi</span>
                            <span class="text-sm text-gray-500 font-light">8 km (10 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia</span>
                            <span class="text-sm text-gray-500 font-light">19 km (25 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Foligno</span>
                            <span class="text-sm text-gray-500 font-light">25 km (25 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Montefalco</span>
                            <span class="text-sm text-gray-500 font-light">43 km (35 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Spoleto</span>
                            <span class="text-sm text-gray-500 font-light">52 km (40 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Rome</span>
                            <span class="text-sm text-gray-500 font-light">183 km (2 h 20 min)</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Airports</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia San Francesco</span>
                            <span class="text-sm text-gray-500 font-light">8 km (10 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Ancona R. Sanzio</span>
                            <span class="text-sm text-gray-500 font-light">108 km (1 h 10 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Firenze Vespucci</span>
                            <span class="text-sm text-gray-500 font-light">186 km (2 h)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Roma Ciampino</span>
                            <span class="text-sm text-gray-500 font-light">194 km (2 h 10 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Roma Fiumicino</span>
                            <span class="text-sm text-gray-500 font-light">208 km (2 h 15 min)</span>
                        </li>
                  </ul>
            </div>
        `,

    gallery: [
      "images/prop16-1.jpg",
      "images/prop16-2.jpg",
      "images/prop16-3.jpg",
      "images/prop16-4.jpg",
      "images/prop16-5.jpg",
      "images/prop16-6.jpg",
      "images/prop16-7.jpg",
      "images/prop16-8.jpg",
      "images/prop16-9.jpg",
      "images/prop16-10.jpg",
      "images/prop16-11.jpg",
      "images/prop16-12.jpg",
      "images/prop16-13.jpg",
      "images/prop16-14.jpg",
      "images/prop16-15.jpg",
      "images/prop16-16.jpg",
      "images/prop16-17.jpg",
      "images/prop16-18.jpg",
      "images/prop16-19.jpg",
      "images/prop16-20.jpg",
    ],
  },
  17: {
    title: "Villa Cassandra, Manor House in a Medieval Town",
    location: "Tuscany \u2013 Siena \u2013 near Siena",
    lifestyle: "City Centre",
    type: "Villa",
    price: "\u20ac 1.500.000",
    sqm: "913 m\u00b2",
    land: "632 m\u00b2",
    beds: "12",
    baths: "12",
    mainImg: "images/prop17-main.jpg",
    mapUrl:
      "https://www.google.com/maps?q=Siena%2C+Tuscany%2C+Italy&z=11&output=embed",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"A walled garden in the middle of a medieval town, which is the trick of the thing."</p>
            <p class="mb-4">In the heart of a <strong>medieval town</strong> a few kilometres from <strong>Siena</strong>, on the edge of the Val d&rsquo;Elsa, an aristocratic manor house with its garden. You can walk to the shops in two minutes, and the <strong>walled garden</strong> means nobody can see you doing nothing in it.</p>
            <p class="mb-4">The villa runs to 732 m&sup2; over four floors. Historic cellars in the basement alongside a kitchen and a vaulted dining room; two large communicating drawing rooms on the ground floor, plus a self-contained apartment with its own entrance. The top two floors hold <strong>seven en-suite bedrooms</strong>, and an internal stair from the first floor climbs to a bedroom and bathroom <strong>in the turret</strong>.</p>
            <p class="mb-4">In a wing of a neighbouring historic building are <strong>two more units</strong> of 111 m&sup2; between them, both entered straight from the garden &mdash; a studio with kitchen and bathroom, and a room with a private bathroom.</p>
            <p class="mb-4">Twelve bedrooms and twelve bathrooms in all, arranged as <strong>three independently manageable units</strong>. There is a hall that would work as a restaurant, and a paved 60 m&sup2; canopy used for dining outdoors in summer.</p>
            <p class="mb-6">The buildings stand around the perimeter of the <strong>632 m&sup2; garden</strong>, which looks out over the Tuscan countryside beyond the wall.</p>
            <p class="text-sm text-gray-500 font-light border-t border-gray-200 pt-6">
              Equally a private house or a hospitality business. Ask us which
              consents are in place if the second is what interests you.
            </p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">The Property</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">In the heart of a medieval town</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Walled garden of 632 m&sup2;</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Turret bedroom with its own bathroom</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Historic vaulted cellars</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Hall usable as a restaurant</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Three independently manageable units</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Covered dining canopy of 60 m&sup2;</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Services 600 m away, Siena 15 km</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">The Buildings</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Villa</span>
                            <span class="text-sm text-gray-500 font-light">732 m&sup2; &middot; 10 bed &middot; 10 bath</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Two further units</span>
                            <span class="text-sm text-gray-500 font-light">111 m&sup2; &middot; 2 bed &middot; 2 bath</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Canopy and tool shed</span>
                            <span class="text-sm text-gray-500 font-light">70 m&sup2;</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Nearby</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Closest services</span>
                            <span class="text-sm text-gray-500 font-light">600 m (2 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Siena</span>
                            <span class="text-sm text-gray-500 font-light">15 km (20 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Monteriggioni</span>
                            <span class="text-sm text-gray-500 font-light">17 km (20 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Colle di Val d&rsquo;Elsa</span>
                            <span class="text-sm text-gray-500 font-light">26 km (30 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">San Gimignano</span>
                            <span class="text-sm text-gray-500 font-light">42 km (45 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Castellina in Chianti</span>
                            <span class="text-sm text-gray-500 font-light">40 km (45 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Volterra</span>
                            <span class="text-sm text-gray-500 font-light">58 km (1 h 10 min)</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Airports</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Firenze Vespucci</span>
                            <span class="text-sm text-gray-500 font-light">90 km (1 h 20 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia San Francesco</span>
                            <span class="text-sm text-gray-500 font-light">125 km (1 h 45 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Pisa G. Galilei</span>
                            <span class="text-sm text-gray-500 font-light">145 km (1 h 50 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Bologna G. Marconi</span>
                            <span class="text-sm text-gray-500 font-light">185 km (2 h 20 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Roma Ciampino</span>
                            <span class="text-sm text-gray-500 font-light">250 km (3 h)</span>
                        </li>
                  </ul>
            </div>
        `,

    gallery: [
      "images/prop17-1.jpg",
      "images/prop17-2.jpg",
      "images/prop17-3.jpg",
      "images/prop17-4.jpg",
      "images/prop17-5.jpg",
      "images/prop17-6.jpg",
      "images/prop17-7.jpg",
      "images/prop17-8.jpg",
      "images/prop17-9.jpg",
      "images/prop17-10.jpg",
      "images/prop17-11.jpg",
      "images/prop17-12.jpg",
      "images/prop17-13.jpg",
      "images/prop17-14.jpg",
      "images/prop17-15.jpg",
      "images/prop17-16.jpg",
      "images/prop17-17.jpg",
      "images/prop17-18.jpg",
      "images/prop17-19.jpg",
      "images/prop17-20.jpg",
    ],
  },
  18: {
    title: "Waterfront Villa on the Sicilian Coast",
    location: "Sicily \u2013 Ragusa \u2013 Ispica",
    lifestyle: "Seaside",
    type: "Villa",
    price: "\u20ac 2.300.000",
    sqm: "200 m\u00b2",
    land: "2.730 m\u00b2",
    beds: "4",
    baths: "4",
    mainImg: "images/prop18-main.jpg",
    mapUrl:
      "https://www.google.com/maps?q=Ispica%2C+Ragusa%2C+Sicily%2C+Italy&z=11&output=embed",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"On the point where the Mediterranean meets the Ionian, with steps down to the rocks."</p>
            <p class="mb-4">On the south-eastern coast of <strong>Sicily</strong> at the gates of <strong>Ispica</strong>, a villa standing on its own headland where the waters of the Mediterranean and the Ionian meet. Terraced stone walls step down the cliff to a paved sun deck and a pavilion at the water&rsquo;s edge.</p>
            <p class="mb-4">The 200 m&sup2; is not one house but <strong>three independent buildings</strong> set in the garden and linked by outside paths &mdash; which is how a Sicilian summer is actually lived, moving between shade and water rather than between rooms.</p>
            <p class="mb-4">The <strong>main villa</strong> of 90 m&sup2; sits closest to the sea: a living room, a kitchen and dining area behind a glass wall that opens completely, and a double bedroom with its own bathroom and a sea-view terrace.</p>
            <p class="mb-4">The two <strong>guesthouses</strong> hold the other three bedrooms across 110 m&sup2;. Every one is en suite with its own entrance and its own shaded terrace, so guests arrive and leave without crossing anyone&rsquo;s morning.</p>
            <p class="mb-6">The renovation is contemporary and restrained &mdash; white walls, reed ceilings, no attempt at grandeur. Marzamemi is twenty minutes away and Noto forty.</p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">The Property</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Directly on the water, private sea access</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Three independent buildings</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Every bedroom en suite with its own terrace</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Grounds of 2,730 m&sup2;</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Terraced stone walls down to the rocks</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Waterside pavilion and sun terrace</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Air conditioning throughout</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Marzamemi 15 km, Noto 32 km</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">The Buildings</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Main villa</span>
                            <span class="text-sm text-gray-500 font-light">90 m&sup2; &middot; 1 bed &middot; 1 bath</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Two guesthouses</span>
                            <span class="text-sm text-gray-500 font-light">110 m&sup2; &middot; 3 bed &middot; 3 bath</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Nearby</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Ispica</span>
                            <span class="text-sm text-gray-500 font-light">14 km (15 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Marzamemi</span>
                            <span class="text-sm text-gray-500 font-light">15 km (20 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Portopalo di Capo Passero</span>
                            <span class="text-sm text-gray-500 font-light">18 km (20 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Noto</span>
                            <span class="text-sm text-gray-500 font-light">32 km (40 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Ragusa</span>
                            <span class="text-sm text-gray-500 font-light">55 km (55 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Siracusa</span>
                            <span class="text-sm text-gray-500 font-light">64 km (1 h)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Catania</span>
                            <span class="text-sm text-gray-500 font-light">119 km (1 h 35 min)</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Airports</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Comiso P. La Torre</span>
                            <span class="text-sm text-gray-500 font-light">76 km (1 h 15 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Catania Fontanarossa</span>
                            <span class="text-sm text-gray-500 font-light">114 km (1 h 30 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Palermo Falcone Borsellino</span>
                            <span class="text-sm text-gray-500 font-light">342 km (3 h 50 min)</span>
                        </li>
                  </ul>
            </div>
        `,

    gallery: [
      "images/prop18-1.jpg",
      "images/prop18-2.jpg",
      "images/prop18-3.jpg",
      "images/prop18-4.jpg",
      "images/prop18-5.jpg",
      "images/prop18-6.jpg",
      "images/prop18-7.jpg",
      "images/prop18-8.jpg",
      "images/prop18-9.jpg",
      "images/prop18-10.jpg",
      "images/prop18-11.jpg",
      "images/prop18-12.jpg",
      "images/prop18-13.jpg",
      "images/prop18-14.jpg",
      "images/prop18-15.jpg",
      "images/prop18-16.jpg",
      "images/prop18-17.jpg",
      "images/prop18-18.jpg",
      "images/prop18-19.jpg",
      "images/prop18-20.jpg",
    ],
  },
  19: {
    title: "Sea-View Villa Project above Marina di Scarlino",
    location: "Tuscany \u2013 Grosseto \u2013 Scarlino",
    lifestyle: "Seaside",
    type: "Villa",
    price: "\u20ac 1.850.000",
    sqm: "188 m\u00b2",
    land: "1.000 m\u00b2",
    beds: "3",
    baths: "3",
    mainImg: "images/prop19-main.jpg",
    mapUrl:
      "https://www.google.com/maps?q=Scarlino%2C+Grosseto%2C+Tuscany%2C+Italy&z=11&output=embed",

    description: `
            <div class="bg-brand-cream/60 border-l-2 border-brand-gold px-6 py-5 mb-8">
              <p class="text-sm text-brand-ink font-medium mb-2">This house has not been built yet.</p>
              <p class="text-sm text-gray-600 font-light leading-relaxed">
                What stands on the site today is the stone structure in the first
                photograph. Every other image is an architectural rendering of the
                approved design. The price covers the land, the existing structure,
                the approved project <em>and the execution of the works</em>, so it
                is sold turnkey &mdash; but you are buying a design, not a finished
                house, and the timetable is a question worth asking early.
              </p>
            </div>
            <p class="font-serif text-xl text-brand-dark italic mb-6">"The highest hill above the harbour, with Elba on the horizon."</p>
            <p class="mb-4">On the summit of the highest hill above the <strong>Marina di Scarlino</strong> harbour, surrounded by thousands of hectares of protected Mediterranean scrub in the <strong>Tuscan Maremma</strong>. The view runs across the Gulf of Follonica to <strong>Elba</strong>, and on the clearest days as far as <strong>Corsica</strong>.</p>
            <p class="mb-4">The approved design reinterprets a <strong>masseria</strong> &mdash; clean lines, low volumes, walls in textured rustic plaster in warm Mediterranean tones. The building opens west to take the sunset, and curves to shelter what sits behind it.</p>
            <p class="mb-4">Behind the villa, a private east-facing courtyard forms the entrance to the master suite. <strong>Terracotta mashrabiya screens</strong> filter the light through the day, which is the idea the whole design turns on.</p>
            <p class="mb-6">188 m&sup2; of interior, three bedrooms and three bathrooms, a panoramic pool, and 1,000 m&sup2; of grounds. Follonica is ten minutes down the hill and Punta Ala fifteen.</p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">What Is Included</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Land, structure and approved project included</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Construction included in the price</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Highest hill above Marina di Scarlino</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Views to Elba, and to Corsica on clear days</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Panoramic pool in the approved design</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Terracotta mashrabiya screens</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Underfloor heating</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Follonica 5 km, Punta Ala 15 km</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Nearby</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Follonica</span>
                            <span class="text-sm text-gray-500 font-light">5 km (10 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Scarlino</span>
                            <span class="text-sm text-gray-500 font-light">8 km (10 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Punta Ala</span>
                            <span class="text-sm text-gray-500 font-light">15 km (15 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Castiglione della Pescaia</span>
                            <span class="text-sm text-gray-500 font-light">15 km (20 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Piombino</span>
                            <span class="text-sm text-gray-500 font-light">30 km (35 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Grosseto</span>
                            <span class="text-sm text-gray-500 font-light">45 km (40 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Bolgheri</span>
                            <span class="text-sm text-gray-500 font-light">55 km (45 min)</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Airports</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Grosseto C. Baccarini</span>
                            <span class="text-sm text-gray-500 font-light">45 km (40 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Pisa G. Galilei</span>
                            <span class="text-sm text-gray-500 font-light">115 km (1 h 10 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Firenze Vespucci</span>
                            <span class="text-sm text-gray-500 font-light">170 km (2 h)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Roma Fiumicino</span>
                            <span class="text-sm text-gray-500 font-light">215 km (2 h 20 min)</span>
                        </li>
                  </ul>
            </div>
        `,

    gallery: [
      "images/prop19-1.jpg",
      "images/prop19-2.jpg",
      "images/prop19-3.jpg",
      "images/prop19-4.jpg",
      "images/prop19-5.jpg",
      "images/prop19-6.jpg",
      "images/prop19-7.jpg",
      "images/prop19-8.jpg",
      "images/prop19-9.jpg",
      "images/prop19-10.jpg",
      "images/prop19-11.jpg",
      "images/prop19-12.jpg",
      "images/prop19-13.jpg",
    ],
  },
  20: {
    title: "Eremo di Todi, Events Estate with Helipad",
    location: "Umbria \u2013 Perugia \u2013 Todi",
    lifestyle: "Country",
    type: "Hotel",
    price: "\u20ac 1.800.000",
    sqm: "1.026 m\u00b2",
    land: "2.53 Ha",
    beds: "9",
    baths: "12",
    mainImg: "images/prop20-main.jpg",
    mapUrl:
      "https://www.google.com/maps?q=Todi%2C+Perugia%2C+Umbria%2C+Italy&z=11&output=embed",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"A chapel, a curate's house and its farms, now a place that can seat a wedding."</p>
            <p class="mb-4">Near <strong>Todi</strong>, inside a large agricultural estate, a hospitality complex made from an <strong>ancient ecclesiastical settlement</strong> &mdash; a chapel, the curate's residence and the farms around them. The restoration kept the fabric intact: brick arches, stone walls, wooden floors laid over tile, tiled roofs.</p>
            <p class="mb-4">It is built to be run, not merely lived in. The basement is entirely back-of-house &mdash; stores, sanitation rooms, staff facilities, plant, and a pantry connected to the kitchen <strong>by lift</strong>. The ground floor is reception and dining, under exposed brick arches at 2.95 m, with a <strong>full professional kitchen</strong>, an accessible WC, a bread oven outside, and a demountable 49 m&sup2; canopy by the kitchen for weather.</p>
            <p class="mb-4">The first floor is accommodation: <strong>seven en-suite bedrooms plus a two-bedroom suite</strong>, parquet floors, beamed ceilings.</p>
            <p class="mb-4">Outside, 2.5 fenced hectares hold an <strong>18 &times; 9 m panoramic pool</strong> with a travertine terrace, barbecue and dining areas, and modular space for concerts and functions. Parking takes <strong>80 cars and two coaches</strong>, and there is a <strong>private helipad</strong>.</p>
            <p class="mb-6">Sold furnished and equipped. Todi is fifteen minutes, Rome&rsquo;s airports around an hour and a half.</p>
            <p class="text-sm text-gray-500 font-light border-t border-gray-200 pt-6">
              Two things to ask about before viewing. The energy rating is
              594 kWh/m&sup2; a year across 1,026 m&sup2;, which is a running cost
              worth quantifying. And if you intend to trade, ask which licences
              transfer with the sale &mdash; the kitchen and the coach parking
              only matter if the permissions come too.
            </p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">The Property</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Private helipad</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Parking for 80 cars and 2 coaches</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Panoramic pool, 18 &times; 9 m</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Professional kitchen and dining hall</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Nine bedrooms, all en suite</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Sold furnished and equipped</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">2.53 ha, fenced</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Todi 12 km, services 3 km</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Nearby</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Closest services</span>
                            <span class="text-sm text-gray-500 font-light">3 km (5 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Massa Martana</span>
                            <span class="text-sm text-gray-500 font-light">11 km (15 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Todi</span>
                            <span class="text-sm text-gray-500 font-light">12 km (15 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Terni</span>
                            <span class="text-sm text-gray-500 font-light">32 km (30 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Spoleto</span>
                            <span class="text-sm text-gray-500 font-light">32 km (40 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia</span>
                            <span class="text-sm text-gray-500 font-light">53 km (45 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Assisi</span>
                            <span class="text-sm text-gray-500 font-light">64 km (1 h)</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Airports</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia San Francesco</span>
                            <span class="text-sm text-gray-500 font-light">55 km (45 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Roma Ciampino</span>
                            <span class="text-sm text-gray-500 font-light">134 km (1 h 40 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Roma Fiumicino</span>
                            <span class="text-sm text-gray-500 font-light">148 km (1 h 35 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Ancona R. Sanzio</span>
                            <span class="text-sm text-gray-500 font-light">159 km (1 h 50 min)</span>
                        </li>
                  </ul>
            </div>
        `,

    gallery: [
      "images/prop20-1.jpg",
      "images/prop20-2.jpg",
      "images/prop20-3.jpg",
      "images/prop20-4.jpg",
      "images/prop20-5.jpg",
      "images/prop20-6.jpg",
      "images/prop20-7.jpg",
      "images/prop20-8.jpg",
      "images/prop20-9.jpg",
      "images/prop20-10.jpg",
      "images/prop20-11.jpg",
      "images/prop20-12.jpg",
      "images/prop20-13.jpg",
      "images/prop20-14.jpg",
      "images/prop20-15.jpg",
      "images/prop20-16.jpg",
      "images/prop20-17.jpg",
      "images/prop20-18.jpg",
      "images/prop20-19.jpg",
      "images/prop20-20.jpg",
    ],
  },
  21: {
    title: "Casale delle Fate, Restored Farmhouse with Pool",
    location: "Umbria \u2013 Perugia \u2013 Umbertide",
    lifestyle: "Country",
    type: "Country House",
    price: "\u20ac 1.850.000",
    sqm: "489 m\u00b2",
    land: "1.74 Ha",
    beds: "6",
    baths: "4",
    mainImg: "images/prop21-main.jpg",
    mapUrl:
      "https://www.google.com/maps?q=Umbertide%2C+Perugia%2C+Umbria%2C+Italy&z=11&output=embed",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"One house, three front doors &mdash; and cellars enough for a fourth."</p>
            <p class="mb-4">In the Umbrian countryside near <strong>Umbertide</strong>, a restored farmhouse on <strong>1.7 hectares of fully fenced land</strong>. Exposed beams, terracotta floors and tall French windows that open onto the hills; the gate closes behind you and the noise stops.</p>
            <p class="mb-4">The villa runs to 434 m&sup2; over two floors and is currently arranged as <strong>three independent apartments</strong>, linked by shared rooms on the ground floor. Each has <strong>its own kitchen and its own wood-burning fireplace</strong>. The master suite has a dressing room and private bathroom.</p>
            <p class="mb-4">Apartment A is 108 m&sup2; with one bedroom; B is 153 m&sup2; with three; C is 83 m&sup2; with two. Live in all of it, live in one and let the others, or open the connections and treat it as a single house &mdash; the layout does not force the decision.</p>
            <p class="mb-4">The old <strong>cellars</strong> on the ground floor would convert to a fourth apartment. Beside the house, an open-plan <strong>outbuilding of 51 m&sup2;</strong> already has a bathroom, kitchenette and fireplace, which makes it usable for guests or staff without further work.</p>
            <p class="mb-6">Outside: the pool, lawns, and 0.4 hectares of olives.</p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">The Property</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">1.74 ha, fully fenced</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Three self-contained apartments</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">A wood-burning fireplace in each</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Swimming pool</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">0.40 ha olive grove</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Cellars with scope for a fourth apartment</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Separate 51 m&sup2; outbuilding</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Umbertide 18 km, services 8 km</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">The Apartments</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Apartment A</span>
                            <span class="text-sm text-gray-500 font-light">108 m&sup2; &middot; 1 bed &middot; 1 bath</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Apartment B</span>
                            <span class="text-sm text-gray-500 font-light">153 m&sup2; &middot; 3 bed &middot; 2 bath</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Apartment C</span>
                            <span class="text-sm text-gray-500 font-light">83 m&sup2; &middot; 2 bed &middot; 1 bath</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Outbuilding</span>
                            <span class="text-sm text-gray-500 font-light">51 m&sup2; &middot; kitchenette and bathroom</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Nearby</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Closest services</span>
                            <span class="text-sm text-gray-500 font-light">8 km (10 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Umbertide</span>
                            <span class="text-sm text-gray-500 font-light">18 km (20 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Citt&agrave; di Castello</span>
                            <span class="text-sm text-gray-500 font-light">23 km (25 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Tuoro sul Trasimeno</span>
                            <span class="text-sm text-gray-500 font-light">28 km (40 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Cortona</span>
                            <span class="text-sm text-gray-500 font-light">31 km (50 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia</span>
                            <span class="text-sm text-gray-500 font-light">52 km (50 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Arezzo</span>
                            <span class="text-sm text-gray-500 font-light">59 km (1 h)</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Airports</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Perugia San Francesco</span>
                            <span class="text-sm text-gray-500 font-light">52 km (45 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Firenze Vespucci</span>
                            <span class="text-sm text-gray-500 font-light">152 km (2 h)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Ancona R. Sanzio</span>
                            <span class="text-sm text-gray-500 font-light">154 km (1 h 50 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Bologna G. Marconi</span>
                            <span class="text-sm text-gray-500 font-light">211 km (2 h 40 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Roma Fiumicino</span>
                            <span class="text-sm text-gray-500 font-light">247 km (2 h 50 min)</span>
                        </li>
                  </ul>
            </div>
        `,

    gallery: [
      "images/prop21-1.jpg",
      "images/prop21-2.jpg",
      "images/prop21-3.jpg",
      "images/prop21-4.jpg",
      "images/prop21-5.jpg",
      "images/prop21-6.jpg",
      "images/prop21-7.jpg",
      "images/prop21-8.jpg",
      "images/prop21-9.jpg",
      "images/prop21-10.jpg",
      "images/prop21-11.jpg",
      "images/prop21-12.jpg",
      "images/prop21-13.jpg",
      "images/prop21-14.jpg",
      "images/prop21-15.jpg",
      "images/prop21-16.jpg",
      "images/prop21-17.jpg",
      "images/prop21-18.jpg",
      "images/prop21-19.jpg",
      "images/prop21-20.jpg",
    ],
  },
  22: {
    title: "Equestrian Estate with 21 Stalls near Arezzo",
    location: "Tuscany \u2013 Arezzo \u2013 Arezzo",
    lifestyle: "Country",
    type: "Country House",
    price: "\u20ac 1.000.000",
    sqm: "2.432 m\u00b2",
    land: "4.04 Ha",
    beds: "5",
    baths: "5",
    mainImg: "images/prop22-main.jpg",
    mapUrl:
      "https://www.google.com/maps?q=Arezzo%2C+Tuscany%2C+Italy&z=11&output=embed",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"A working yard, not a house with stables attached."</p>
            <p class="mb-4">Near <strong>Arezzo</strong>, an equestrian estate built around a modern <strong>stable of 1,900 m&sup2;</strong> with a <strong>covered arena of 20 &times; 46 m</strong>. Twenty-one stalls run down the long sides. At one end sit the offices, a club house, a refectory, a barn and stores.</p>
            <p class="mb-4">Outside the stable are an <strong>open-air arena of 50 &times; 80 m</strong> and four paddocks, with four hectares of arable land around the whole thing.</p>
            <p class="mb-4">The <strong>farmhouse</strong> of 459 m&sup2; stands a short way off, over two floors. It <strong>needs renovating</strong> &mdash; that is stated plainly because it is most of the work a buyer would be taking on. Restored, it would serve either as the owner&rsquo;s house or as accommodation for the yard.</p>
            <p class="mb-6">A shed next to it once held animals, carriages and tools; a 73 m&sup2; store and a 140 m&sup2; canopy complete the property.</p>
            <p class="text-sm text-gray-500 font-light border-t border-gray-200 pt-6">
              Of the 2,432 m&sup2; recorded, 1,900 is stable and 459 is the
              farmhouse awaiting renovation. Worth asking whether the yard
              trades today, and which licences would come with it.
            </p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">The Yard</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">21 horse stalls</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Covered arena, 20 &times; 46 m</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Outdoor arena, 50 &times; 80 m</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Four paddocks</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Club house, offices and refectory</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">4.04 ha of arable land</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Barn, workshop and 140 m&sup2; canopy</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Arezzo nearby</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">The Buildings</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Stable and covered arena</span>
                            <span class="text-sm text-gray-500 font-light">1,900 m&sup2; &middot; 21 stalls</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Farmhouse</span>
                            <span class="text-sm text-gray-500 font-light">459 m&sup2; &middot; 5 bed &middot; 5 bath &middot; to renovate</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Store</span>
                            <span class="text-sm text-gray-500 font-light">73 m&sup2;</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Canopy</span>
                            <span class="text-sm text-gray-500 font-light">140 m&sup2;</span>
                        </li>
                  </ul>
            </div>
        `,

    gallery: [
      "images/prop22-1.jpg",
      "images/prop22-2.jpg",
      "images/prop22-3.jpg",
      "images/prop22-4.jpg",
      "images/prop22-5.jpg",
      "images/prop22-6.jpg",
      "images/prop22-7.jpg",
      "images/prop22-8.jpg",
      "images/prop22-9.jpg",
      "images/prop22-10.jpg",
      "images/prop22-11.jpg",
      "images/prop22-12.jpg",
      "images/prop22-13.jpg",
      "images/prop22-14.jpg",
      "images/prop22-15.jpg",
      "images/prop22-16.jpg",
      "images/prop22-17.jpg",
      "images/prop22-18.jpg",
      "images/prop22-19.jpg",
      "images/prop22-20.jpg",
    ],
  },
  23: {
    title: "Organic Wine Estate on the Tuscan Coast",
    location: "Tuscany \u2013 Pisa \u2013 Montescudaio",
    lifestyle: "Country",
    type: "Vineyards and Wineries",
    price: "\u20ac 8.700.000",
    sqm: "726 m\u00b2",
    land: "75.87 Ha",
    beds: "4",
    baths: "7",
    mainImg: "images/prop23-main.jpg",
    mapUrl:
      "https://www.google.com/maps?q=Montescudaio%2C+Pisa%2C+Tuscany%2C+Italy&z=11&output=embed",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"Twenty-eight hectares of vines above the Tyrrhenian, and a cellar already running."</p>
            <p class="mb-4">In the <strong>Val di Cecina</strong> near <strong>Montescudaio</strong>, a short drive from the Tyrrhenian coast, an <strong>organic winery</strong> across roughly <strong>76 hectares</strong> of hillside. The working core is <strong>28.2 hectares of vineyard</strong> on two plots, planted to eight varieties &mdash; Sangiovese, Merlot, Syrah, Cabernet Franc, Cabernet Sauvignon and Petit Verdot in red, Viognier and Roussanne in white &mdash; producing up to <strong>240,000 bottles</strong> of Costa Toscana IGT a year.</p>
            <p class="mb-4">One vineyard has a <strong>natural spring</strong> with a storage basin and drip irrigation, which in this part of Tuscany is worth more than it sounds. The remaining land is 18.3 hectares of arable, available for further planting, and 35.5 hectares of woodland.</p>
            <p class="mb-4">The <strong>cellar</strong> of 330 m&sup2; is modern and partly underground, laid out in three areas &mdash; winemaking, barrel store and packaging. Above it sits a guesthouse; beside it a covered patio of 78 m&sup2; for dinners and events, which also carries the solar array.</p>
            <p class="mb-4">The <strong>farmhouse</strong> of 298 m&sup2; has been fully restored and split in two. The ground floor is the commercial side: offices, tasting rooms and a shop for the estate&rsquo;s wines. Upstairs is the house &mdash; a living room with open kitchen, three en-suite bedrooms, and a turret currently used as a study.</p>
            <p class="mb-6">An <strong>orangery</strong> of 42 m&sup2; in metal and glass stands a little apart, used as a summer sitting room. Bolgheri is twenty-five minutes.</p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">The Estate</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Organic certification</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">28.2 ha of vineyard across two plots</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Up to 240,000 bottles a year</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Modern part-underground cellar</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Natural spring with drip irrigation</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">35.5 ha of woodland, 18.3 ha arable</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Photovoltaic system on the patio roof</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Montescudaio 2 km, the sea 10 km</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Planted To</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Reds</span>
                            <span class="text-sm text-gray-500 font-light">Sangiovese, Merlot, Syrah, Cabernet Franc</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium"></span>
                            <span class="text-sm text-gray-500 font-light">Cabernet Sauvignon, Petit Verdot</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Whites</span>
                            <span class="text-sm text-gray-500 font-light">Viognier, Roussanne</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">The Buildings</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Farmhouse</span>
                            <span class="text-sm text-gray-500 font-light">298 m&sup2; &middot; 3 bed &middot; 4 bath</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Cellar</span>
                            <span class="text-sm text-gray-500 font-light">330 m&sup2; &middot; part underground</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Guesthouse</span>
                            <span class="text-sm text-gray-500 font-light">56 m&sup2; &middot; 1 bed &middot; 1 bath</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Covered patio</span>
                            <span class="text-sm text-gray-500 font-light">78 m&sup2;</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Orangery</span>
                            <span class="text-sm text-gray-500 font-light">42 m&sup2;</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Nearby</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Montescudaio</span>
                            <span class="text-sm text-gray-500 font-light">2 km (5 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Casale Marittimo</span>
                            <span class="text-sm text-gray-500 font-light">6 km (10 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Cecina</span>
                            <span class="text-sm text-gray-500 font-light">10 km (15 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Bolgheri</span>
                            <span class="text-sm text-gray-500 font-light">18 km (25 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Volterra</span>
                            <span class="text-sm text-gray-500 font-light">30 km (40 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Livorno</span>
                            <span class="text-sm text-gray-500 font-light">52 km (50 min)</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Airports</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Pisa G. Galilei</span>
                            <span class="text-sm text-gray-500 font-light">68 km (1 h)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Firenze Vespucci</span>
                            <span class="text-sm text-gray-500 font-light">120 km (1 h 40 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Bologna G. Marconi</span>
                            <span class="text-sm text-gray-500 font-light">205 km (2 h 35 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Roma Fiumicino</span>
                            <span class="text-sm text-gray-500 font-light">325 km (3 h 35 min)</span>
                        </li>
                  </ul>
            </div>
        `,

    gallery: [
      "images/prop23-1.jpg",
      "images/prop23-2.jpg",
      "images/prop23-3.jpg",
      "images/prop23-4.jpg",
      "images/prop23-5.jpg",
      "images/prop23-6.jpg",
      "images/prop23-7.jpg",
      "images/prop23-8.jpg",
      "images/prop23-9.jpg",
      "images/prop23-10.jpg",
      "images/prop23-11.jpg",
      "images/prop23-12.jpg",
      "images/prop23-13.jpg",
      "images/prop23-14.jpg",
      "images/prop23-15.jpg",
      "images/prop23-16.jpg",
      "images/prop23-17.jpg",
      "images/prop23-18.jpg",
      "images/prop23-19.jpg",
      "images/prop23-20.jpg",
    ],
  },
  24: {
    title: "Medieval Castle Estate in the Mugello",
    location: "Tuscany \u2013 Florence \u2013 Barberino di Mugello",
    lifestyle: "Country",
    type: "Castle",
    price: "\u20ac 4.800.000",
    sqm: "5.314 m\u00b2",
    land: "62.25 Ha",
    beds: "60",
    baths: "40",
    mainImg: "images/prop24-main.jpg",
    mapUrl:
      "https://www.google.com/maps?q=Barberino+di+Mugello%2C+Florence%2C+Tuscany%2C+Italy&z=11&output=embed",

    description: `
            <p class="font-serif text-xl text-brand-dark italic mb-6">"A fortified tower in the 11th century, a villa by the 17th, and taking guests now."</p>
            <p class="mb-4">On the <strong>Mugello</strong> hills above Barberino, a <strong>62-hectare estate</strong> around a medieval castle, running today as accommodation. Nearly a thousand years of continuous use, and 5,314 m&sup2; of floor area.</p>
            <p class="mb-4">The castle itself is <strong>2,587 m&sup2;</strong> of stone on the hilltop. It began in the <strong>11th century</strong>, probably as a fortified tower, and grew into a control point for the Mugello. Florence took it in the 13th century, and a document of <strong>1269</strong> describes a palazzo with a tower and thirteen houses set along the walls.</p>
            <p class="mb-4">Its military life ended in the late 14th century without much incident. By a census of the mid-17th it is described as a villa rather than a castle &mdash; the point at which it had become a country house. Families came and went, each renovating, none much altering it.</p>
            <p class="mb-4">Between <strong>1915 and 1917</strong> the architect <strong>Agenore Socini</strong> restored the castle and laid out the <strong>Italian garden of 6,600 m&sup2;</strong> down the south slope, which is what you see below the walls today.</p>
            <p class="mb-6">Sixty bedrooms and forty bathrooms across the estate, and a swimming pool. Florence is fifty minutes and its airport forty.</p>
            <p class="text-sm text-gray-500 font-light border-t border-gray-200 pt-6">
              The castle accounts for 2,587 of the 5,314 m&sup2;; the rest sits in
              further buildings the agency has not itemised publicly. Ask us for
              the full schedule, and for which businesses and licences are
              included &mdash; at sixty bedrooms that is the substance of the deal.
            </p>
        `,

    descriptionFeatures: `
            <div class="pt-8 border-t border-gray-200 mt-8">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">The Estate</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Castle of 2,587 m&sup2;, 11th-century origins</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">62.25 ha of hillside</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Italian garden of 6,600 m&sup2;</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">60 bedrooms, 40 bathrooms</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Swimming pool</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Trading as accommodation</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Florence 45 km, its airport 35 km</span>
                    </div>

                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 font-light">Bologna 75 km</span>
                    </div>
                </div>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Nearby</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Closest services</span>
                            <span class="text-sm text-gray-500 font-light">1 km (5 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Borgo San Lorenzo</span>
                            <span class="text-sm text-gray-500 font-light">15 km (20 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Fiesole</span>
                            <span class="text-sm text-gray-500 font-light">30 km (40 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Pontassieve</span>
                            <span class="text-sm text-gray-500 font-light">40 km (50 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Florence</span>
                            <span class="text-sm text-gray-500 font-light">45 km (50 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Pistoia</span>
                            <span class="text-sm text-gray-500 font-light">60 km (45 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Bologna</span>
                            <span class="text-sm text-gray-500 font-light">75 km (1 h)</span>
                        </li>
                  </ul>
            </div>

            <div class="pt-8 mt-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Airports</h3>
                  <ul class="space-y-2">
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Firenze Vespucci</span>
                            <span class="text-sm text-gray-500 font-light">35 km (40 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Bologna G. Marconi</span>
                            <span class="text-sm text-gray-500 font-light">70 km (55 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Pisa G. Galilei</span>
                            <span class="text-sm text-gray-500 font-light">110 km (1 h 20 min)</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-100 pb-2">
                            <span class="text-sm text-gray-800 font-medium">Rimini F. Fellini</span>
                            <span class="text-sm text-gray-500 font-light">195 km (2 h 10 min)</span>
                        </li>
                  </ul>
            </div>
        `,

    gallery: [
      "images/prop24-1.jpg",
      "images/prop24-2.jpg",
      "images/prop24-3.jpg",
      "images/prop24-4.jpg",
      "images/prop24-5.jpg",
      "images/prop24-6.jpg",
      "images/prop24-7.jpg",
      "images/prop24-8.jpg",
      "images/prop24-9.jpg",
      "images/prop24-10.jpg",
      "images/prop24-11.jpg",
      "images/prop24-12.jpg",
      "images/prop24-13.jpg",
      "images/prop24-14.jpg",
      "images/prop24-15.jpg",
      "images/prop24-16.jpg",
      "images/prop24-17.jpg",
      "images/prop24-18.jpg",
      "images/prop24-19.jpg",
      "images/prop24-20.jpg",
    ],
  },
};
