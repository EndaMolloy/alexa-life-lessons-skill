module.exports ={
  formatSheet: data => {

    const sheetArr = data.map(lesson =>{
      return {
        "title": lesson.title.$t,
        "lesson": getLessonBody(lesson.content.$t),
        "interpret": getInterpretBody(lesson.content.$t)
      }
    })

    return sheetArr;
  }
}


//needed to remove column headings from the string
//needed to remove column headings from the string
function getLessonBody(text){
  const splitOnStory = text.split("story:");
  splitOnStory.shift();
  const rejoin = splitOnStory.join();
  const splitOnInter = rejoin.split(", interpretation:");
  splitOnInter.pop();
  return splitOnInter.join();
}

function getInterpretBody(text){
  const splitOnInter = text.split(", interpretation:");
  return splitOnInter.pop();
}
