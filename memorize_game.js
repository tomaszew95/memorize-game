var memorizeGamePlugin = document.getElementById("ceros-memorize-game-plugin")
(function(){
    'use strict'; 
    require.config({ 
        paths: { 
            CerosSDK: '//sdk.ceros.com/standalone-player-sdk-v5.min' 
        } 
    }); 
    require(['CerosSDK'], function (CerosSDK) { 
        CerosSDK.findExperience() 
            .fail(function (error) { 
                console.error(error); 
            }) 
            .done(function (experience) { 
                window.myExperience = experience

                //gathering all Ceros objects
                var playGame = experience.findLayersByTag("start-game")
                var timelines = experience.findLayersByTag("timeline")
                var congratulationPopups = experience.findLayersByTag("congratulation")
                var reveals = experience.findLayersByTag("reveal")
                var fronts = experience.findLayersByTag("front")
                var backs = experience.findLayersByTag("back")

                experience.on(CerosSDK.EVENTS.PAGE_CHANGED, pageChangedCallback);
                function pageChangedCallback(){
                    let pageContainer = document.querySelector(".page-viewport.top > .page-container")
                    let rotationIntensity = parseFloat(memorizeGamePlugin.getAttribute("rotation-intensity"))*2 //"*2" because "randomValue" is between "-.5" and ".5"

                    //setting timeline and congratulation pop-up
                    let timeline = null
                    let congratulationPopup = null
                    var mainFilter = (filterArray) =>{
                        let arr = filterArray.filter(($object) =>{
                            let $obj = document.getElementById($object.id)
                            if(pageContainer.contains($obj)){
                                return $object;
                            }
                        })
                        return arr
                    }
                    timeline = mainFilter(timelines)[0]
                    congratulationPopup = mainFilter(congratulationPopups)[0]

                    //gathering objects into arrays
                    let groupsArray = []
                    let positionsArray = []

                    let twoCards = []
                    let twoBacks = []

                    let maxTwo = 0
                    let totalNumber = 0
                    let correctAnswers = 0

                    //initial function for starting the game
                    var startGame = () =>{
                        for(let i = 0; i<reveals.layers.length; i++){
                            let randomValue = Math.random()-.5

                            let hot = document.getElementById(reveals.layers[i].id)
                            let cardGroup = $(hot).parent()[0]
                            groupsArray.push(cardGroup)
                            
                            let objectPosition = {
                                positionX: cardGroup.style.left, 
                                positionY: cardGroup.style.top,
                                rotation: `${Math.round(randomValue*rotationIntensity)}deg`
                            }
                            positionsArray[i] = objectPosition
                        }

                        let posArrayLength = positionsArray.length
                        for(let j = 0; j<posArrayLength; j++){
                            let itemNumber = Math.floor(Math.random()*positionsArray.length)
                            let item = positionsArray[itemNumber]

                            groupsArray[j].style.left = item.positionX
                            groupsArray[j].style.top = item.positionY
                            groupsArray[j].style.transform = `rotate(${item.rotation})`

                            positionsArray = positionsArray.filter(object => object !== item)
                        }
                    }
                    startGame()

                    //tracking clicks on hotspots
                    var revealsClickedCallback = function(component){
                        var tags = component.getTags()
                        var valueNumber = 0
                        _.forEach(tags, function(value, key){
                            if(value.indexOf("value:") > -1){
                                valueNumber = value.slice(6, value.length)
                                totalNumber += parseInt(valueNumber)
                            }
                        })

                        let cerosCard = (cerosObject) => {
                            let cerosObj = cerosObject.layers.filter((object) =>{
                                let obj = null
                                let tag = object.getTags()
                                _.forEach(tag, function(value, key){
                                    if(value.indexOf(`value:${valueNumber}`) > -1){
                                        obj = object
                                    }
                                })
                                return obj
                            })
                            return cerosObj[0]
                        }
                        
                        maxTwo += 1
                        twoCards.push(cerosCard(fronts))
                        twoBacks.push(cerosCard(backs))

                        if(maxTwo ==2 && totalNumber ==0){
                            console.log('good work!')
                            twoCards = []
                            twoBacks = []
                            maxTwo = 0

                            correctAnswers++
                            if(correctAnswers==6){ 
                                congratulationPopup.show()
                                correctAnswers=0
                            }
                        }
                        else if(maxTwo==2){
                            console.log('try again!')
                            for(let reveal of reveals.layers){
                                reveal.hide()
                            }
                            setTimeout(()=>{
                                for(let reveal of reveals.layers){
                                    reveal.show()
                                }

                                for(let card of twoCards){
                                    card.hide()
                                }
                                twoCards = []

                                for(let back of twoBacks){
                                    back.show()
                                }
                                twoBacks = []
                                
                            }, 1200)

                            maxTwo = 0
                            totalNumber = 0
                            timeline.click()
                        }
                    }

                    reveals.on(CerosSDK.EVENTS.CLICKED, revealsClickedCallback)
                    playGame.on(CerosSDK.EVENTS.CLICKED, startGame)
                }
            }) 
    }); 
})();