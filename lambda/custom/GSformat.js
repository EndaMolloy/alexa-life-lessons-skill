module.exports ={
  formatSheet: data => {

    const sheetArr = data.map(lesson =>{
      return {
        "title": lesson.title.$t,
        "lesson": lesson.content.$t
      }
    })

    return sheetArr;
  }
}
