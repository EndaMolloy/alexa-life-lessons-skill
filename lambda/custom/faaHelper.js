module.exports = {
  formatResponse: (response)=> {
    if(response.delay === true){
      return `There is currently a delay for ${response.name}. ` +
`The average delay time is ${response.status.avgDelay}.`
    }else{
      return `There is no delay for ${response.name}.`
    }
  }
}
