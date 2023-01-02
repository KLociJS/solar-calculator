import * as fs from 'node:fs';

const data = fs.readFileSync('pvwatts_hourly_data.csv', 'utf8')
const dataArr = data.split('\r\n').map(header => header.replaceAll('"', ''))
const header = dataArr[0].split(',')
header[0] = 'month'

let lista = []
let total = {}

for (let i = 1; i < dataArr.length; i++) {
    let obj = {}
    let dataArray = dataArr[i].split(',').map(num => parseFloat(num))
    for (let j = 0; j < dataArray.length; j++) {
        if (header[j].includes('(')) {
            let objProp = header[j].split(' ').filter(word => !word.includes('(')).join(' ')
            let unit = header[j].split(' ').filter(word => word.includes('(')).join('').slice(1, -1)
            obj[objProp] = {
                value: dataArray[j],
                unit: unit
            }
        } else {
            obj[header[j]] = dataArray[j]
        }
    }
    if (!Number.isNaN(obj.month)) {
        lista.push(obj)
    } else {
        for (let data in obj) {
            if (!Number.isNaN(obj[data])) {
                total[data] = obj[data]
            }
        }
    }
}

// 1 *Határozzuk meg, hogy az adott év melyik napján volt a `DC Array Output` a legnagyobb? Melyik hónapban volt ez?

let highestDCArrayOutput = lista.reduce((acc, curr) => acc['DC Array Output'].value < curr['DC Array Output'].value ? acc = curr : acc, lista[0])
//console.log(highestDCArrayOutput);

// 2 *Határozzuk meg, hogy az adott év melyik napján volt  a `DC Array Output` a legkisebb? Melyik hónapban volt ez?
let lowestDCArrayOutput = lista.reduce((acc, curr) => acc['DC Array Output'].value > curr['DC Array Output'].value ? acc = curr : acc, lista[0])
//console.log(lowestDCArrayOutput);

// 3 **Határozzuk meg a `DC Array Output` értékét havi bontásban.
let DCArrayOutputMonthlyDistribution = lista.reduce((acc, curr) => {
    if (acc.hasOwnProperty(curr.month)) {
        acc[curr.month] += curr[`DC Array Output`].value
    } else {
        acc[curr.month] = curr[`DC Array Output`].value
    }
    return acc
}, {})

let DCArrayOutputMonthlyDistributionArray = []
Object.keys(DCArrayOutputMonthlyDistribution).forEach(key=>{
    DCArrayOutputMonthlyDistributionArray.push({month:key,value:DCArrayOutputMonthlyDistribution[key]})
})
//console.log(DCArrayOutputMonthlyDistribution);
//console.log(DCArrayOutputMonthlyDistributionArray);

// 4. *Határozzuk meg az adott évben  a `DC Array Output` összegét!
let SumOfDCArrayOut = lista.reduce((acc, curr) => acc += curr['DC Array Output'].value, 0)
//console.log(SumOfDCArrayOut);

// 5. *Határozzuk meg az adott évben `DC Array Output` átlagát!
let YearlyAvgOfDCArrayOutput = SumOfDCArrayOut / lista.length
//console.log(YearlyAvgOfDCArrayOutput);

// 6. **Határozzuk meg havi szinten `DC Array Output` szórását (az éves átlaghoz képest)!
let monthlyDispersion = lista.reduce((acc, curr, i) => {
    if (!acc.hasOwnProperty(curr.month)) {
        acc[curr.month] = {}
        acc[curr.month].value = Math.pow(curr['DC Array Output'].value - YearlyAvgOfDCArrayOutput, 2)
        acc[curr.month].numOfItems = 1
    } else {
        acc[curr.month].value += Math.pow(curr['DC Array Output'].value - YearlyAvgOfDCArrayOutput, 2)
        acc[curr.month].numOfItems++
    }

    if ((lista[i].month < lista[i + 1]?.month) || lista[i + 1] == undefined) acc[curr.month] = Math.sqrt(acc[curr.month].value / acc[curr.month].numOfItems)

    return acc
}, {})

let monthlyDispersionArray = []
Object.keys(monthlyDispersion).forEach(key=>{
    monthlyDispersionArray.push({month:key,value:monthlyDispersion[key]})
})
//console.log(monthlyDispersionArray);
//console.log(monthlyDispersion);

//7. ***Készítsünk egy összetett adatstruktúrát a havi bontásra vonatkozó `DC Array Output`-ra:
let complexDataDCArrayOutput = []
Object.keys(monthlyDispersion).forEach(dispersion => complexDataDCArrayOutput.push({ 'σ': monthlyDispersion[dispersion] }))

let monthlyAvg = lista.reduce((acc, curr, i) => {
    if (!acc.hasOwnProperty(curr.month)) {
        acc[curr.month] = {
            value: curr['DC Array Output'].value,
            numberOfData: 1
        }
    } else {
        acc[curr.month].value += curr['DC Array Output'].value
        acc[curr.month].numberOfData++
    }
    if (lista[i].month != lista[i + 1]?.month) {
        acc[curr.month] = acc[curr.month].value / acc[curr.month].numberOfData
    }
    return acc
}, {})
Object.keys(monthlyAvg).forEach((key, i) => {
    complexDataDCArrayOutput[i].avg = monthlyAvg[key]
})

// console.log(complexDataDCArrayOutput);


// 8. ***Határozzuk meg a `DC Array Output` értékét havi bontásban (havi összeg) és rendüzzük a hónapokat e összeg szerint növekvő sorrendbe!

let sumOfDCAOArray = []
Object.keys(DCArrayOutputMonthlyDistribution).forEach(key=>sumOfDCAOArray.push(DCArrayOutputMonthlyDistribution[key]))
sumOfDCAOArray.sort((a,b)=> a-b)

let sortedMonths = []

sumOfDCAOArray.forEach(data=>{
    Object.keys(DCArrayOutputMonthlyDistribution).forEach(key=>{
        if(DCArrayOutputMonthlyDistribution[key]==data){
            sortedMonths.push(key)
        }
    })
})

//console.log(sortedMonths);

// 9. ***Határozzuk meg a `DC Array Output` értékét havi bontásban (havi összeg) és rendüzzük a hónapokat e összeg szerint csökkenő sorrendbe!

let descendSortMonths = sortedMonths.reverse()

//console.log(descendSortMonths);

// 10. *Határozzuk meg napi szinten a `DC Array Output` értékét!
let dailyDCArrayOutput = []
let dailySumOfDCAO = 0

lista.forEach((data,i)=>{
    if(data.month === lista[i+1]?.month && data.Day === lista[i+1]?.Day){
        dailySumOfDCAO += data['DC Array Output'].value
    } else {
        dailySumOfDCAO += data['DC Array Output'].value
        dailyDCArrayOutput.push({month: data.month, day: data.Day, value:dailySumOfDCAO})
        dailySumOfDCAO = 0
    }
})
//console.log(dailyDCArrayOutput);

// 11. **Rendezzük növekvő sorrendbe a napi szintű `DC Array Output` statisztikát.
let ascendingOrderDailyDCAO = [...dailyDCArrayOutput].sort((a,b)=> a.value - b.value)
//console.log(ascendingOrderDailyDCAO);


// 12. **Rendezzük csökkenő sorrendbe a napi szintű `DC Array Output` statisztikát.

let descendingOrderDailyDCAO = [...dailyDCArrayOutput].sort((a,b)=> b.value - a.value)
//console.log(descendingOrderDailyDCAO);

// 13. *Melyik volt a legmelegebb nap (napi átlaghőmérséklet alapján)?
// 'Ambient Temperature': { value: -7.1, unit: 'C' },
// average daily temperature
let dailyAverageTemerature = []
let dailySumOfTemperature = 0

lista.forEach((data,i)=>{
    if(data.month === lista[i+1]?.month && data.Day === lista[i+1]?.Day){
        dailySumOfTemperature += lista[i]['Ambient Temperature'].value/24
    } else {
        dailySumOfTemperature += lista[i]['Ambient Temperature'].value/24
        dailyAverageTemerature.push({month: lista[i].month, day: lista[i].Day, value:dailySumOfTemperature})
        dailySumOfTemperature = 0
    }
})
// hottest day
//console.log(dailyAverageTemerature);
let hottestDay = dailyAverageTemerature.reduce((acc,curr)=>acc.value < curr.value ? acc=curr : acc ,dailyAverageTemerature[0])
//console.log(hottestDay);  

// 14. *Melyik volt a leghidegebb nap (napi átlaghőmérséklet alapján)?
let coldestDay = dailyAverageTemerature.reduce((acc,curr)=>acc.value > curr.value ? acc=curr : acc ,dailyAverageTemerature[0])
//console.log(coldestDay);

// 15. *Melyik volt a legszelesebb nap (napi szélsebesség átlag alapján)?
// 'Wind Speed': { value: 1, unit: 'm/s' },
// daily wind speed
let dailyWindSpeed = []
let dailySumOfwindSpeed = 0
lista.forEach((data,i)=>{
    if(data.month === lista[i+1]?.month && data.Day === lista[i+1]?.Day){
        dailySumOfwindSpeed += data['Wind Speed'].value/24
    } else {
        dailySumOfwindSpeed += data['Wind Speed'].value/24
        dailyWindSpeed.push({month: lista[i].month, day: lista[i].Day, value:dailySumOfwindSpeed})
        dailySumOfwindSpeed = 0
    }
})
//console.log(dailyWindSpeed);

let mostWindyDay = dailyWindSpeed.reduce((acc,curr)=>acc.value < curr.value ? acc=curr : acc ,dailyWindSpeed[0])
//console.log(mostWindyDay);

//console.log(lista);

// 16. *Melyik volt a leg szélmentesebb nap (napi szélsebesség átlag alapján)?

let leastWindyDay = dailyWindSpeed.reduce((acc,curr)=>acc.value > curr.value ? acc=curr : acc ,dailyWindSpeed[0])
//console.log(leastWindyDay);

// 17. ****Keressük meg azokat a napokat (minimális számú napokat), amelyek az évi `DC Array Output` 80%-át adták!

let helperArray = lista.map(data=>({month:data.month,day:data.Day,hour:data.Hour,value:data['DC Array Output'].value}))
let sumOfDCAO = helperArray.reduce((acc,curr)=>acc+=curr.value,0) / 100 * 80
helperArray.sort((a,b)=>b.value-a.value)

let counter = 0
let result = []
helperArray.forEach(data=>{
    counter+=data.value
    if(counter<sumOfDCAO) result.push(data)
})

// let test = result.reduce((acc,curr)=>acc+=curr.value,0)
// console.log(test, sumOfDCAO);

// 19.
// avg solar panel eletricity production in hungary per year = 1250kWh/m^2

const dcArrayOutput = lista.map(data=>data['DC Array Output'].value)

let yearlyElectricityProduction = dcArrayOutput.reduce((acc,curr,i)=>dcArrayOutput[i+1]!==undefined ? acc+=curr+(dcArrayOutput[i+1]-curr)/2 : acc,0)


console.log(yearlyElectricityProduction); // 7546907 Wh = 7546.9 kWh

//console.log(lista);