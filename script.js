document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const filterSubSelect = document.getElementById('filterSubSelect');
  const filterViewsSelect = document.getElementById('filterViewsSelect');
  const sortSelect = document.getElementById('sortSelect');
  const displayCountSelect = document.getElementById('displayCountSelect');
  const channelList = document.getElementById('channelList');
  const totalChannels = document.getElementById('totalChannels');
  const downloadButton = document.getElementById('downloadCSV');

  const toggleAdvancedBtn = document.getElementById('toggleAdvancedBtn');
  const advancedOptions = document.getElementById('advancedOptions');
  const filterCountrySelect = document.getElementById('filterCountrySelect');

  const excludeAutomatedCheckbox = document.getElementById(
    'excludeAutomatedCheckbox'
  );
  const excludeVevoCheckbox = document.getElementById('excludeVevoCheckbox');

  const channelModal = document.getElementById('channelModal');
  const closeModalBtn = document.getElementById('closeModal');
  const modalHeader = document.getElementById('modalHeader');
  const modalBody = document.getElementById('modalBody');
  const visitChannelBtn = document.getElementById('visitChannelBtn');

  const loadingSpinner = document.getElementById('loadingSpinner');

  const automatedChannelIDs = [
    'UClgRkhTL3_hImCAmdLfDE4g',
    'UC-9-kyTW8ZkZNDHQJ6FgpwQ',
    'UCOpNcN46UbXVtpKMrmU4Abg',
    'UCEgdi0XIXXZ-qJOFPf4JSKw',
    'UCYfdidRxbB8Qhf0Nx7ioOYw',
    'UCF0pVplsI8R5kcAqgtoRqoA',
    'UCQvWX73GQygcwXOTSf_VDVg',
    'UCUhkLR2YOMtWF44kSb-TxyA',
    'UC_vVy4OI86F0amXqFN_zTMg',
    'UC4R8DWoMoI7CAwX8_LjQHig',
    'UCO_8hF-oulap_6lXy0oXLjg',
    'UCl8dMTqDrJQ0c8y23UBu4kQ',
  ];

  const vevoChannelIDs = [
    'UC3MLnJtqc_phABBriLRhtgQ',
    'UCgwv23FVv3lqh567yagXfNg',
    'UCHkj014U2CQ2Nv0UZeYpE_A',
    'UCANLZYMidaCbLQFWXBC95Jg',
    'UC2xskkQVFEpLcGFnNSLQY0A',
    'UC20vb-R_px4CguHzzBPhoyQ',
    'UC-8Q-hLdECwQmaWNwXitYDw',
    'UCTNtRdBAiZtHP9w7JinzfUg',
    'UCbW18JZRgko_mOGm5er8Yzg',
    'UCGnjeahCJW1AF34HBmQTJ-Q',
    'UC0VOyT2OCBKdQhF3BAbZ-1g',
    'UCLp8RBhQHu9wSsq62j_Md6A',
    'UComP_epzeKzvBX156r6pm1Q',
    'UCN1hnUccO4FD5WfM7ithXaw',
    'UCjK8ORC71kwyj1DWFwril_A',
    'UCFkoPRmuxqr37jvGmmpzhzQ',
    'UCrHL_BF5lHyK43BxLU8-vBQ',
    'UCVttQE6tS_agDSAU61Q65aA',
    'UC9zX2xZIJ4cnwRsgBpHGvMg',
    'UCaum3Yzdl3TbBt8YUeUGZLQ',
    'UCm1dsgJNnhaLkY3uAdqN4mA',
    'UCaHNFIob5Ixv74f5on3lvIw',
    'UCnyB9MYKRkSFK3IIB32CoVw',
    'UCRzzwLpLiUNIs6YOPe33eMg',
  ];

  let allChannels = [];
  let displayChannels = [];
  let countryMap = {};
  let displayCount = parseInt(displayCountSelect.value, 10);

  function showLoadingSpinner() {
    loadingSpinner.classList.remove('hidden');
  }
  function hideLoadingSpinner() {
    const isRendered = channelList.childNodes.length > 0;
    if (isRendered) {
      loadingSpinner.classList.add('hidden');
    }
  }

  toggleAdvancedBtn.addEventListener('click', () => {
    advancedOptions.classList.toggle('hidden');
  });

  async function fetchCountryNames() {
    try {
      const response = await axios.get(
        'https://restcountries.com/v3.1/all?fields=cca2,name'
      );
      const map = {};
      response.data.forEach(country => {
        if (country.cca2) {
          map[country.cca2] = country.name.common;
        }
      });
      return map;
    } catch (error) {
      console.error('Error fetching country names:', error);
      return {};
    }
  }

  function populateCountrySelect(codesInUse) {
    const sortedCodes = [...codesInUse].sort((a, b) => {
      const nameA = countryMap[a] || '';
      const nameB = countryMap[b] || '';
      return nameA.localeCompare(nameB);
    });

    filterCountrySelect.innerHTML = '';
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'Filter: Country';
    filterCountrySelect.appendChild(allOption);

    sortedCodes.forEach(cc => {
      const countryName = countryMap[cc];
      if (countryName) {
        const option = document.createElement('option');
        option.value = cc;
        option.textContent = countryName;
        filterCountrySelect.appendChild(option);
      }
    });
  }

  async function fetchChannels() {
    const size = 2050;
    showLoadingSpinner();

    try {
      const response = await axios.get(
        `https://api.communitrics.com/api/top-channels?page=1&size=${size}`
      );
      allChannels = response.data.channels.map((ch, index) => ({
        ...ch,
        originalRank: index + 1,
      }));

      const uniqueCodes = new Set(
        allChannels.map(ch => ch.country_code).filter(Boolean)
      );
      populateCountrySelect(uniqueCodes);

      renderChannels();
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      hideLoadingSpinner();
    }
  }

  function renderChannels() {
    channelList.innerHTML = '';

    const searchValue = searchInput.value.toLowerCase();
    const subFilter = filterSubSelect.value;
    const viewFilter = filterViewsSelect.value;
    const sortValue = sortSelect.value;
    const countryFilter = filterCountrySelect.value;
    const excludeAutomated = excludeAutomatedCheckbox.checked;
    const excludeVevo = excludeVevoCheckbox.checked;
    displayCount = parseInt(displayCountSelect.value, 10);

    let filtered = allChannels.filter(ch => {
      const matchSearch = ch.title.toLowerCase().includes(searchValue);

      let matchSubs = true;
      switch (subFilter) {
        case '100m':
          matchSubs = ch.sub_num >= 100000000;
          break;
        case '50m':
          matchSubs = ch.sub_num >= 50000000;
          break;
        case '20m':
          matchSubs = ch.sub_num >= 20000000;
          break;
        case '10m':
          matchSubs = ch.sub_num >= 10000000;
          break;
        default:
          matchSubs = true;
      }

      let matchViews = true;
      switch (viewFilter) {
        case '100b':
          matchViews = ch.view_num >= 100000000000;
          break;
        case '50b':
          matchViews = ch.view_num >= 50000000000;
          break;
        case '10b':
          matchViews = ch.view_num >= 10000000000;
          break;
        case '5b':
          matchViews = ch.view_num >= 5000000000;
          break;
        default:
          matchViews = true;
      }

      let matchCountry = true;
      if (countryFilter !== 'all') {
        matchCountry = ch.country_code === countryFilter;
      }

      let matchAutomated = true;
      if (excludeAutomated) {
        matchAutomated = !automatedChannelIDs.includes(ch.id);
      }

      let matchVevo = true;
      if (excludeVevo) {
        matchVevo = !vevoChannelIDs.includes(ch.id);
      }

      return (
        matchSearch &&
        matchSubs &&
        matchViews &&
        matchCountry &&
        matchAutomated &&
        matchVevo
      );
    });

    filtered.sort((a, b) => {
      switch (sortValue) {
        case 'subs-desc':
          return b.sub_num - a.sub_num;
        case 'subs-asc':
          return a.sub_num - b.sub_num;
        case 'views-desc':
          return b.view_num - a.view_num;
        case 'views-asc':
          return a.view_num - b.view_num;
        default:
          return 0;
      }
    });

    filtered = filtered.slice(0, displayCount);

    const shouldCalculateDisplayRank =
      sortValue === 'subs-desc' ||
      sortValue === 'views-desc' ||
      excludeAutomated ||
      excludeVevo;

    if (shouldCalculateDisplayRank) {
      filtered = filtered.map((ch, index) => ({
        ...ch,
        displayRank: index + 1,
      }));
    }

    if (
      sortValue === 'views-asc' &&
      searchValue === '' &&
      subFilter === 'all' &&
      viewFilter === 'all' &&
      countryFilter === 'all' &&
      !excludeAutomated &&
      !excludeVevo
    ) {
      const tempSorted = [...filtered].sort((a, b) => b.view_num - a.view_num);
      const viewsDescRankMap = new Map();
      tempSorted.forEach((ch, index) => {
        viewsDescRankMap.set(ch.id, index + 1);
      });

      filtered = filtered.map(ch => ({
        ...ch,
        displayRank: viewsDescRankMap.get(ch.id),
      }));
    }

    const shouldShowDisplayRank =
      (sortValue === 'subs-desc' &&
        searchValue === '' &&
        subFilter === 'all' &&
        viewFilter === 'all' &&
        countryFilter === 'all') ||
      (sortValue === 'views-desc' &&
        searchValue === '' &&
        subFilter === 'all' &&
        viewFilter === 'all' &&
        countryFilter === 'all') ||
      (sortValue === 'views-asc' &&
        searchValue === '' &&
        subFilter === 'all' &&
        viewFilter === 'all' &&
        countryFilter === 'all') ||
      excludeAutomated ||
      excludeVevo;

    displayChannels = filtered;

    displayChannels.forEach(channel => {
      const countryName = countryMap[channel.country_code] || 'Unknown';

      const card = document.createElement('div');
      card.className = `
              bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl
              transition duration-300 cursor-pointer p-5
              border border-gray-700 flex flex-col hover-scale overflow-hidden
              relative group
            `;

      const rank =
        shouldShowDisplayRank && channel.displayRank
          ? channel.displayRank
          : channel.originalRank;

      card.innerHTML = `
              <div class="absolute inset-0 bg-gradient-to-r from-red-600 to-red-800 
                          opacity-0 group-hover:opacity-10 transition-opacity duration-300">
              </div>
              
              <div class="flex items-center mb-4 relative z-10">
                <div class="w-16 rounded-full p-1 bg-gradient-to-br from-red-600 to-red-800 mr-4 flex-shrink-0">
                  <img
                    src="${channel.avatar}"
                    alt="${channel.title}"
                    class="w-full h-full rounded-full object-cover object-center border-2 border-white/20"
                  />
                </div>
                <div class="text-gray-100">
                  <h3 class="text-lg font-bold tracking-tight">
                    <span class="text-red-400 mr-2">#${rank}</span>
                    <span class="group-hover:text-red-400 transition-colors">
                      ${channel.title}
                    </span>
                  </h3>
                  <p class="text-xs text-gray-400 mt-1">Channel ID: ${
                    channel.id
                  }</p>
                </div>
              </div>
              <div class="space-y-2 text-sm text-gray-300 relative z-10">
                <p class="flex items-center">
                  <i class="fas fa-user-friends text-red-500 mr-2 w-4 text-center"></i>
                  <span class="font-semibold mr-1">Subscribers:</span>
                  ${channel.sub_num.toLocaleString()}
                </p>
                <p class="flex items-center">
                  <i class="fas fa-eye text-red-500 mr-2 w-4 text-center"></i>
                  <span class="font-semibold mr-1">Total Views:</span>
                  ${channel.view_num.toLocaleString()}
                </p>
                <p class="flex items-center">
                  <i class="fas fa-globe text-red-500 mr-2 w-4 text-center"></i>
                  <span class="font-semibold mr-1">Country:</span>
                  ${countryName}
                </p>
              </div>
            `;
      card.addEventListener('click', () =>
        openModal({ ...channel, country: countryName })
      );
      channelList.appendChild(card);
    });

    totalChannels.textContent = `Total Channels: ${displayChannels.length.toLocaleString()}`;
  }

  function openModal(ch) {
    const {
      displayRank,
      originalRank,
      avatar,
      title,
      id,
      sub_num,
      view_num,
      country,
    } = ch;

    const sortValue = sortSelect.value;
    const excludeAutomated = excludeAutomatedCheckbox.checked;
    const excludeVevo = excludeVevoCheckbox.checked;
    const searchValue = searchInput.value.toLowerCase();
    const subFilter = filterSubSelect.value;
    const viewFilter = filterViewsSelect.value;
    const countryFilter = filterCountrySelect.value;

    const shouldShowDisplayRank =
      (sortValue === 'subs-desc' &&
        searchValue === '' &&
        subFilter === 'all' &&
        viewFilter === 'all' &&
        countryFilter === 'all') ||
      (sortValue === 'views-desc' &&
        searchValue === '' &&
        subFilter === 'all' &&
        viewFilter === 'all' &&
        countryFilter === 'all') ||
      (sortValue === 'views-asc' &&
        searchValue === '' &&
        subFilter === 'all' &&
        viewFilter === 'all' &&
        countryFilter === 'all') ||
      excludeAutomated ||
      excludeVevo;

    const rank =
      shouldShowDisplayRank && ch.displayRank
        ? ch.displayRank
        : ch.originalRank;

    modalHeader.innerHTML = `
            <img
              src="${avatar}"
              alt="${title}"
              class="w-14 h-14 rounded-full object-cover"
            />
            <div>
              <h3 class="text-lg font-bold">
                #${rank} – ${title}
              </h3>
              <p class="text-xs text-gray-300 mt-1">
                Channel ID: ${id}
              </p>
            </div>
          `;

    modalBody.innerHTML = `
            <div class="space-y-3 mt-2">
              <p>
                <i class="fas fa-user-friends text-red-400 mr-1"></i>
                <span class="font-semibold">Subscribers:</span>
                ${sub_num.toLocaleString()}
              </p>
              <p>
                <i class="fas fa-eye text-red-400 mr-1"></i>
                <span class="font-semibold">Total Views:</span>
                ${view_num.toLocaleString()}
              </p>
              <p>
                <i class="fas fa-globe text-red-400 mr-1"></i>
                <span class="font-semibold">Country:</span>
                ${country}
              </p>
            </div>
          `;

    visitChannelBtn.setAttribute(
      'href',
      `https://www.youtube.com/channel/${id}`
    );

    channelModal.classList.remove('hidden');
    channelModal.classList.add('show');
  }

  function closeModal() {
    channelModal.classList.remove('show');
    channelModal.classList.add('hidden');
  }

  closeModalBtn.addEventListener('click', closeModal);
  channelModal.addEventListener('click', e => {
    if (e.target === channelModal) {
      closeModal();
    }
  });

  function downloadCSV() {
    const headers = [
      'Rank',
      'Channel ID',
      'Channel Name',
      'Subscribers',
      'Views',
      'Country',
      'Profile Picture URL',
    ];

    const sortValue = sortSelect.value;
    const excludeAutomated = excludeAutomatedCheckbox.checked;
    const excludeVevo = excludeVevoCheckbox.checked;
    const searchValue = searchInput.value.toLowerCase();
    const subFilter = filterSubSelect.value;
    const viewFilter = filterViewsSelect.value;
    const countryFilter = filterCountrySelect.value;

    const shouldShowDisplayRank =
      (sortValue === 'subs-desc' &&
        searchValue === '' &&
        subFilter === 'all' &&
        viewFilter === 'all' &&
        countryFilter === 'all') ||
      (sortValue === 'views-desc' &&
        searchValue === '' &&
        subFilter === 'all' &&
        viewFilter === 'all' &&
        countryFilter === 'all') ||
      (sortValue === 'views-asc' &&
        searchValue === '' &&
        subFilter === 'all' &&
        viewFilter === 'all' &&
        countryFilter === 'all') ||
      excludeAutomated ||
      excludeVevo;

    const rows = displayChannels.map(ch => {
      const rank =
        shouldShowDisplayRank && ch.displayRank
          ? ch.displayRank
          : ch.originalRank;

      return [
        rank,
        ch.id,
        ch.title.replace(/[",]/g, ''),
        ch.sub_num,
        ch.view_num,
        countryMap[ch.country_code] || 'Unknown',
        ch.avatar,
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'youtube_channels.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function init() {
    countryMap = await fetchCountryNames();
    await fetchChannels();

    searchInput.addEventListener('input', renderChannels);
    filterSubSelect.addEventListener('change', renderChannels);
    filterViewsSelect.addEventListener('change', renderChannels);
    sortSelect.addEventListener('change', renderChannels);
    displayCountSelect.addEventListener('change', renderChannels);
    filterCountrySelect.addEventListener('change', renderChannels);
    excludeAutomatedCheckbox.addEventListener('change', renderChannels);
    excludeVevoCheckbox.addEventListener('change', renderChannels);

    downloadButton.addEventListener('click', downloadCSV);
  }

  init();
});
