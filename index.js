$(document).ready(() => {
    const main = new Main();

    main.InitializeEvents();
})

function Main() {
    const main = this;
    const BaseURL = 'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/';
    const preSelectedCurrencies = ['usd', 'eur', 'aud', 'cad', 'chf', 'nzd', 'bgn']

    this.InitializeEvents = function () {
        main.LoadDropdownSelections();

        $('#slcCrrncy').change(function (e) {
            var currency = e.target.value;

            main.GetExchangeRates(currency)
        })
    }

    this.GetExchangeRates = async function (selectedCurrency) {
        main.showLoadingScreen(true);

        let rates = [];

        await Promise.all(preSelectedCurrencies.map(async function (curr, i) {
            let tempRates = [];

            if (curr !== selectedCurrency) {
                rates.push({
                    key: `${selectedCurrency}-${curr}`,
                    value: await $.get(BaseURL + `${selectedCurrency}/${curr}.json`)
                })
                rates.push({
                    key: `${curr}-${selectedCurrency}`,
                    value: await $.get(BaseURL + `${curr}/${selectedCurrency}.json`)
                })
            }

            return rates
        }))

        // if (i === preSelectedCurrencies.length - 1) {

            let longArrCount = main.GetLongestArrayCount(rates);
            
            $('#longArrCount').text(`Longest Array Length: ${longArrCount}`)
            
            main.SetCurrenciesToLocal(JSON.stringify({
                defaultSelected: selectedCurrency,
                longArrCount,
                rates
            }));
            main.GroupExchangeRates(rates);
        // }
    }

    this.LoadDropdownSelections = function () {
        var htmlString = ``
        var localCurrencies = main.GetLocalCurrencies('currencyRates');
        var defaultSelected = localCurrencies ? localCurrencies.defaultSelected : 'usd'

        preSelectedCurrencies.map(curr => {
            htmlString += `<option ${curr === defaultSelected ? 'selected' : ''} value='${curr}'>${curr.toUpperCase()}</option>`;
        })

        $('#slcCrrncy').html(htmlString)

        //load USD exchange rates
        if(localCurrencies) {
            $('#longArrCount').text(`Longest Array Length: ${main.GetLongestArrayCount(localCurrencies.rates)}`)
            main.GroupExchangeRates(localCurrencies.rates)
        }

        main.GetExchangeRates($('#slcCrrncy option:selected').val())
    }

    this.GroupExchangeRates = function (rates = []) {
        let group1 = rates.filter(rate => Object.values(rate.value)[1] < 1)
        let group2 = rates.filter(rate => Object.values(rate.value)[1] >= 1 && Object.values(rate.value)[1] < 1.5)
        let group3 = rates.filter(rate => Object.values(rate.value)[1] >= 1.5)


        main.PopulateGroupedRates(group1, group2, group3)
    }

    this.PopulateGroupedRates = async function(...groups) {
        await groups.forEach((group, idx) => {
            $($('ul#listGroup')[idx]).html('');
            let sortedGroup = group.sort((a, b) => Object.values(a.value)[1] - Object.values(b.value)[1]);

            sortedGroup.map(x => {
                let htmlString = `<li class="list-group-item">${x.key}: ${Object.values(x.value)[1]}</li>`
                $($('ul#listGroup')[idx]).append(htmlString);
            })

            $($('h6#rateCount')[idx]).text(`Count: ${group.length}`)
        })

        main.showLoadingScreen(false)
    }

    this.showLoadingScreen = function(isOpen) {
        $('#loadingScreen').css('display', isOpen ? 'block' : 'none')
    }

    this.SetCurrenciesToLocal = function (rates = []) {
        localStorage.clear();
        localStorage.setItem('currencyRates', rates)
    }
    
    this.GetLocalCurrencies = function() {
        return JSON.parse(localStorage.getItem('currencyRates'));
    }

    this.GetLongestArrayCount = function(rates) {
        let longestArray = rates.map(rate => {
            let totalArrVal = 0;
            let filteredRate = rates.filter(x => x.key !== rate.key)
            filteredRate.map(fRate => {
                if(Math.abs(Object.values(rate.value)[1] - Object.values(fRate.value)[1]) <= 0.5) {
                    totalArrVal += 1;
                }
            })

            return totalArrVal
        })
        let maxArr = Math.max(...longestArray)
        
        return longestArray.filter(x => x === maxArr).length;
    }
}