// Translation dictionary
const translations = {
    en: {
        siteTitle: "Pokemon With Me",
        searchPlaceholder: "Search Pokémon...",
        allGenerations: "All Generations",
        allTypes: "All Types",
        sortById: "Sort by ID",
        sortByName: "Sort by Name",
        loading: "Loading Pokémon... {progress}%",
        error: "Oops! Something went wrong.",
        tryRefresh: "Please try refreshing the page.",
        noResults: "No Pokémon found.",
        tryDifferent: "Try a different search term.",
        baseStats: "Base Stats",
        evolutionChain: "Evolution Chain",
        skills: "Skills",
        noSkills: "No skills available",
        noEvolution: "No evolution chain available",
        failedEvolution: "Failed to load evolution chain",
        level: "Lv.",
        types: {
            normal: "Normal",
            fire: "Fire",
            water: "Water",
            electric: "Electric",
            grass: "Grass",
            ice: "Ice",
            fighting: "Fighting",
            poison: "Poison",
            ground: "Ground",
            flying: "Flying",
            psychic: "Psychic",
            bug: "Bug",
            rock: "Rock",
            ghost: "Ghost",
            dragon: "Dragon",
            dark: "Dark",
            steel: "Steel",
            fairy: "Fairy"
        }
    },
    vi: {
        siteTitle: "Pokemon Cùng Tôi",
        searchPlaceholder: "Tìm Pokémon...",
        allGenerations: "Tất cả các thế hệ",
        allTypes: "Tất cả các loại",
        sortById: "Sắp xếp theo ID",
        sortByName: "Sắp xếp theo tên",
        loading: "Đang tải Pokémon... {progress}%",
        error: "Đã xảy ra lỗi!",
        tryRefresh: "Vui lòng tải lại trang.",
        noResults: "Không tìm thấy Pokémon.",
        tryDifferent: "Thử tìm kiếm khác.",
        baseStats: "Chỉ số cơ bản",
        evolutionChain: "Chuỗi tiến hóa",
        skills: "Kỹ năng",
        noSkills: "Không có kỹ năng",
        noEvolution: "Không có chuỗi tiến hóa",
        failedEvolution: "Không tải được chuỗi tiến hóa",
        level: "Cấp",
        types: {
            normal: "Bình thường",
            fire: "Lửa",
            water: "Nước",
            electric: "Điện",
            grass: "Cỏ",
            ice: "Băng",
            fighting: "Chiến đấu",
            poison: "Độc",
            ground: "Đất",
            flying: "Bay",
            psychic: "Siêu năng lực",
            bug: "Côn trùng",
            rock: "Đá",
            ghost: "Ma",
            dragon: "Rồng",
            dark: "Bóng tối",
            steel: "Thép",
            fairy: "Tiên"
        }
    }
};

// Cache DOM elements
const pokemonGrid = document.getElementById('pokemonGrid');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const genFilter = document.getElementById('genFilter');
const sortFilter = document.getElementById('sortFilter');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const errorSubtext = document.getElementById('errorSubtext');
const noResults = document.getElementById('noResults');
const noResultsText = document.getElementById('noResultsText');
const noResultsSubtext = document.getElementById('noResultsSubtext');
const languageToggle = document.getElementById('languageToggle');
const languageText = document.getElementById('languageText');
const siteTitle = document.getElementById('siteTitle');

// State management
let allPokemon = [];
let filteredPokemon = [];
let currentLanguage = localStorage.getItem('language') || 'en';

// Generation ranges
const genRanges = {
    '1': [1, 151],
    '2': [152, 251],
    '3': [252, 386],
    '4': [387, 493],
    '5': [494, 649],
    '6': [650, 721],
    '7': [722, 809],
    '8': [810, 905],
    '9': [906, 1008]
};

// Type colors for Pokemon cards
const typeColors = {
    normal: 'bg-gray-400',
    fire: 'bg-red-500',
    water: 'bg-blue-500',
    electric: 'bg-yellow-400',
    grass: 'bg-green-500',
    ice: 'bg-blue-200',
    fighting: 'bg-red-700',
    poison: 'bg-purple-500',
    ground: 'bg-yellow-600',
    flying: 'bg-blue-400',
    psychic: 'bg-pink-500',
    bug: 'bg-green-400',
    rock: 'bg-yellow-700',
    ghost: 'bg-purple-700',
    dragon: 'bg-purple-600',
    dark: 'bg-gray-700',
    steel: 'bg-gray-500',
    fairy: 'bg-pink-400'
};

// Fetch Pokemon data from PokeAPI
async function fetchPokemonData() {
    try {
        showLoading();
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1008');
        const data = await response.json();
        
        // Fetch detailed data for each Pokemon in smaller batches for better performance
        const batchSize = 30;
        const batches = [];
        
        for (let i = 0; i < data.results.length; i += batchSize) {
            const batch = data.results.slice(i, i + batchSize);
            batches.push(batch);
        }
        
        let detailedData = [];
        for (const batch of batches) {
            const batchData = await Promise.all(
                batch.map(async (pokemon) => {
                    const response = await fetch(pokemon.url);
                    return response.json();
                })
            );
            detailedData = [...detailedData, ...batchData];
            
            // Update UI progressively and show loading progress
            const progress = Math.round((detailedData.length / data.results.length) * 100);
            loadingSpinner.innerHTML = `
                <div class="flex flex-col items-center">
                    <div class="relative w-20 h-20">
                        <div class="absolute top-0 w-20 h-20 rounded-full border-4 border-t-red-600 animate-spin"></div>
                        <div class="absolute top-8 left-8 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                    <div class="mt-4 text-gray-600">${getTranslation('loading', { progress })}</div>
                </div>
            `;
            
            allPokemon = detailedData.map(pokemon => ({
                id: pokemon.id,
                name: pokemon.name,
                types: pokemon.types.map(type => type.type.name),
                image: pokemon.sprites.other['official-artwork'].front_default,
                stats: pokemon.stats.map(stat => ({
                    name: stat.stat.name,
                    value: stat.base_stat
                })),
                moves: pokemon.moves.slice(0, 4).map(moveObj => moveObj.move.name),
                species: pokemon.species.url
            }));
            
            filteredPokemon = [...allPokemon];
            renderPokemon();
        }
        hideLoading();
    } catch (error) {
        console.error('Error fetching Pokemon:', error);
        showError();
    }
}

// Render Pokemon cards
function renderPokemon() {
    if (filteredPokemon.length === 0) {
        showNoResults();
        return;
    }

    hideNoResults();
    hideError();

    pokemonGrid.innerHTML = filteredPokemon.map(pokemon => `
        <div class="pokemon-card bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-200 hover:scale-105 cursor-pointer"
             onclick="showPokemonDetails(${pokemon.id})">
            <div class="relative pt-[100%]">
                <img src="${pokemon.image}" 
                     alt="${pokemon.name}" 
                     class="absolute top-0 left-0 w-full h-full object-contain p-4"
                     onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'">
            </div>
            <div class="p-4">
                <div class="text-gray-500 text-sm mb-1">#${String(pokemon.id).padStart(4, '0')}</div>
                <h2 class="text-xl font-semibold capitalize mb-2">${pokemon.name}</h2>
                <div class="flex gap-2">
                    ${pokemon.types.map(type => `
                        <span class="${typeColors[type]} text-white px-3 py-1 rounded-full text-sm">
                            ${translations[currentLanguage].types[type]}
                        </span>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

// Fetch evolution chain data
async function fetchEvolutionChain(speciesUrl) {
    try {
        const speciesResponse = await fetch(speciesUrl);
        const speciesData = await speciesResponse.json();
        
        const evolutionChainResponse = await fetch(speciesData.evolution_chain.url);
        const evolutionChainData = await evolutionChainResponse.json();
        
        return processEvolutionChain(evolutionChainData.chain);
    } catch (error) {
        console.error('Error fetching evolution chain:', error);
        return [];
    }
}

// Process evolution chain recursively
function processEvolutionChain(chain) {
    const evolutions = [];
    
    function traverseChain(node) {
        const pokemonName = node.species.name;
        evolutions.push({
            name: pokemonName,
            min_level: node.evolution_details?.[0]?.min_level || null,
            trigger: node.evolution_details?.[0]?.trigger?.name || null,
            item: node.evolution_details?.[0]?.item?.name || null
        });
        
        if (node.evolves_to && node.evolves_to.length > 0) {
            node.evolves_to.forEach(evolution => traverseChain(evolution));
        }
    }
    
    traverseChain(chain);
    return evolutions;
}

// Show Pokemon details in a modal
async function showPokemonDetails(id) {
    const pokemon = allPokemon.find(p => p.id === id);
    if (!pokemon) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    
    // Initial modal content with loading state for evolution chain
    modal.innerHTML = createModalContent(pokemon, null, true);
    document.body.appendChild(modal);

    try {
        // Fetch evolution chain data
        const evolutions = await fetchEvolutionChain(pokemon.species);
        const evolutionPokemon = await Promise.all(
            evolutions.map(async (evo) => {
                const matchedPokemon = allPokemon.find(p => p.name === evo.name);
                if (matchedPokemon) {
                    return {
                        ...matchedPokemon,
                        evolution_details: {
                            min_level: evo.min_level,
                            trigger: evo.trigger,
                            item: evo.item
                        }
                    };
                }
                return null;
            })
        );

        // Update modal content with evolution chain
        modal.innerHTML = createModalContent(pokemon, evolutionPokemon.filter(Boolean), false);
    } catch (error) {
        console.error('Error loading evolution chain:', error);
        modal.innerHTML = createModalContent(pokemon, null, false, true);
    }
}

// Create modal content
function createModalContent(pokemon, evolutionPokemon, isLoading = false, hasError = false) {
    return `
        <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div class="relative">
                <button onclick="this.closest('.fixed').remove()" 
                        class="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
                <div class="p-6">
                    <div class="flex items-center mb-4">
                        <h2 class="text-3xl font-bold capitalize mr-4">${pokemon.name}</h2>
                        <span class="text-gray-500">#${String(pokemon.id).padStart(4, '0')}</span>
                    </div>
                    <div class="flex flex-col md:flex-row gap-6">
                        <div class="md:w-1/2">
                            <img src="${pokemon.image}" 
                                 alt="${pokemon.name}" 
                                 class="w-full h-auto"
                                 onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'">
                            <div class="flex gap-2 mt-4">
                                ${pokemon.types.map(type => `
                                    <span class="${typeColors[type]} text-white px-4 py-2 rounded-full text-sm">
                                        ${translations[currentLanguage].types[type]}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                        <div class="md:w-1/2">
                            <h3 class="text-xl font-semibold mb-4">${getTranslation('baseStats')}</h3>
                            ${pokemon.stats.map(stat => `
                                <div class="mb-4">
                                    <div class="flex justify-between mb-1">
                                        <span class="capitalize">${stat.name.replace('-', ' ')}</span>
                                        <span class="font-semibold">${stat.value}</span>
                                    </div>
                                    <div class="h-2 bg-gray-200 rounded-full">
                                        <div class="h-full bg-blue-500 rounded-full" 
                                             style="width: ${(stat.value / 255) * 100}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                            
                            <h3 class="text-xl font-semibold mb-4 mt-6">${getTranslation('evolutionChain')}</h3>
                            <div class="evolution-chain bg-gray-50 rounded-lg p-4">
                                ${isLoading ? `
                                    <div class="flex justify-center items-center py-8">
                                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                    </div>
                                ` : hasError ? `
                                    <div class="text-center text-gray-500 py-4">
                                        ${getTranslation('failedEvolution')}
                                    </div>
                                ` : evolutionPokemon && evolutionPokemon.length > 0 ? `
                                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        ${evolutionPokemon.map((evo, index) => `
                                            ${index > 0 ? `
                                                <div class="flex items-center justify-center">
                                                    <i class="fas fa-arrow-right text-gray-400"></i>
                                                    ${evo.evolution_details.min_level ? `
                                                        <span class="text-sm text-gray-500 ml-2">
                                                            Lv. ${evo.evolution_details.min_level}
                                                        </span>
                                                    ` : ''}
                                                    ${evo.evolution_details.item ? `
                                                        <span class="text-sm text-gray-500 ml-2">
                                                            ${evo.evolution_details.item.replace('-', ' ')}
                                                        </span>
                                                    ` : ''}
                                                </div>
                                            ` : ''}
                                            <div class="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
                                                <img src="${evo.image}" 
                                                     alt="${evo.name}" 
                                                     class="w-24 h-24 object-contain"
                                                     onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'">
                                                <span class="text-sm font-medium capitalize mt-2">${evo.name}</span>
                                                <span class="text-xs text-gray-500">#${String(evo.id).padStart(4, '0')}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : `
                                    <div class="text-center text-gray-500 py-4">
                                        ${getTranslation('noEvolution')}
                                    </div>
                                `}
                            </div>
                            
                            <h3 class="text-xl font-semibold mb-4 mt-6">${getTranslation('skills')}</h3>
                            <div class="flex flex-wrap gap-2">
                                ${pokemon.moves && pokemon.moves.length > 0 
                                    ? pokemon.moves.map((move, index) => `
                                        <span class="skill-badge inline-block bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full px-4 py-2 text-sm capitalize transform transition-transform duration-200 hover:scale-105"
                                              style="--skill-index: ${index}">
                                            ${move.replace('-', ' ')}
                                        </span>
                                    `).join('')
                                    : `<p class="text-gray-500">${getTranslation('noSkills')}</p>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Filter Pokemon based on search and type
function filterPokemon() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedType = typeFilter.value.toLowerCase();
    const selectedGen = genFilter.value;
    const sortBy = sortFilter.value;

    filteredPokemon = allPokemon.filter(pokemon => {
        const matchesSearch = pokemon.name.toLowerCase().includes(searchTerm);
        const matchesType = selectedType === '' || pokemon.types.includes(selectedType);
        const matchesGen = selectedGen === '' || 
            (pokemon.id >= genRanges[selectedGen][0] && pokemon.id <= genRanges[selectedGen][1]);
        return matchesSearch && matchesType && matchesGen;
    });

    // Sort Pokemon
    filteredPokemon.sort((a, b) => {
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        }
        return a.id - b.id;
    });

    renderPokemon();
}

// UI state management functions
function showLoading() {
    loadingSpinner.classList.remove('hidden');
    pokemonGrid.classList.add('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
    pokemonGrid.classList.remove('hidden');
}

function showError() {
    errorMessage.classList.remove('hidden');
    pokemonGrid.classList.add('hidden');
    loadingSpinner.classList.add('hidden');
    errorText.textContent = getTranslation('error');
    errorSubtext.textContent = getTranslation('tryRefresh');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function showNoResults() {
    noResults.classList.remove('hidden');
    pokemonGrid.classList.add('hidden');
    noResultsText.textContent = getTranslation('noResults');
    noResultsSubtext.textContent = getTranslation('tryDifferent');
}

function hideNoResults() {
    noResults.classList.add('hidden');
    pokemonGrid.classList.remove('hidden');
}

// Event listeners
searchInput.addEventListener('input', filterPokemon);
typeFilter.addEventListener('change', filterPokemon);
genFilter.addEventListener('change', filterPokemon);
sortFilter.addEventListener('change', filterPokemon);

// Translation functions
function getTranslation(key, params = {}) {
    const text = translations[currentLanguage][key] || translations['en'][key] || key;
    return Object.entries(params).reduce((str, [key, value]) => 
        str.replace(`{${key}}`, value), text);
}

function updateTranslations() {
    // Update static elements
    siteTitle.innerHTML = `<i class="fas fa-dragon mr-3 animate-pulse text-yellow-400"></i>${getTranslation('siteTitle')}`;
    searchInput.placeholder = getTranslation('searchPlaceholder');
    languageText.textContent = currentLanguage.toUpperCase();

    // Update filter options
    genFilter.querySelector('option[value=""]').textContent = getTranslation('allGenerations');
    typeFilter.querySelector('option[value=""]').textContent = getTranslation('allTypes');
    sortFilter.querySelector('option[value="id"]').textContent = getTranslation('sortById');
    sortFilter.querySelector('option[value="name"]').textContent = getTranslation('sortByName');

    // Update type filter options
    Array.from(typeFilter.querySelectorAll('option[data-type]')).forEach(option => {
        const type = option.getAttribute('data-type');
        option.textContent = translations[currentLanguage].types[type];
    });

    // Re-render current view
    if (filteredPokemon.length === 0) {
        showNoResults();
    } else {
        renderPokemon();
    }
}

// Language toggle handler
languageToggle.addEventListener('click', () => {
    currentLanguage = currentLanguage === 'en' ? 'vi' : 'en';
    localStorage.setItem('language', currentLanguage);
    updateTranslations();
});

// Initialize
fetchPokemonData();
updateTranslations();

// Scroll button functionality
const scrollTopBtn = document.getElementById('scrollTopBtn');
const scrollBottomBtn = document.getElementById('scrollBottomBtn');

if (scrollTopBtn && scrollBottomBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    scrollBottomBtn.addEventListener('click', () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        });
    });

    // Show/hide scroll-to-top button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollTopBtn.classList.remove('opacity-0');
            scrollTopBtn.classList.add('opacity-100');
        } else {
            scrollTopBtn.classList.add('opacity-0');
            scrollTopBtn.classList.remove('opacity-100');
        }
    });
}
