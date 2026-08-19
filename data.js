// BAZA PODATAKA NEKRETNINA (data.js)

const propertiesDB = {
  // --- PROPERTY 1: TODI VILLA (FULL DETALJI) ---
  1: {
    title: "Luxury Design Villa with Pool",
    location: "Umbria – Perugia – Todi",
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
};
