module.exports ={
  formatSheet: data => {

    const sheetArr = data.map(lesson =>{
      return {
        "title": lesson.title.$t,
        "lesson": removeColHeading(lesson.content.$t)
      }
    })

    return sheetArr;
  }
}


function removeColHeading(text){
  const splitText = text.split(":")
  splitText.shift();
  return splitText.join();
}
