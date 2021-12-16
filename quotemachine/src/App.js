import React from "react";
import "./App.css"
const API="https://tanimtbh.github.io/quotes/api/quotes.json";

class App extends React.Component {
  constructor(props) {
    super(props);
    // initialize state here
    
    this.state = {
      input: '',
      quotes : undefined,
      index:0,
      num:0,
      bgcolor:["back1","back2", "back3", "back4", "back5","back6", "back7", "back8", "back9","back10","back11", "back12", "back13","back14"],
      color:["color1","color2", "color3", "color4", "color5","color6", "color7", "color8", "color9","color10","color11", "color12", "color13","color14"]
    }

  }

  componentDidMount(){
      fetch(API).then(res=> res.json()).then(res=>{
        this.setState({
          quotes:res["quotes"]
        },this.randomIndex);
      });
  }
randomIndex=()=>{
  if(this.state.quotes){
    this.setState({
      index:Math.floor(Math.random() * this.state.quotes.length)
    });
  }
  this.setState({
    num:Math.floor(Math.random()*14)
  });
}

handleChange= (event) =>{

  this.setState({

    input: event.target.value

  })

}

  render() {
    const quote =this.state.quotes&&this.state.quotes[this.state.index];
    let back=this.state.bgcolor[this.state.num];
    let color=this.state.color[this.state.num];
    document.body.classList=[back]
    return (
        
        <div className="App fadeIn flex flex-col items-center content-center">
          {
           quote&&<div id="quote-box" className={'bg-gray-50 drop-shadow-lg max-w-lg px-10 py-10 rounded-xl mt-20 text-center'}>
            <h1 id="text" className={'text-3xl font-bold '+color}>  " {quote.quote}"</h1>
            <h1 id="author" className={color}>- {quote.author}</h1>
              <div className="flex justify-between">
                <a href={'https://twitter.com/intent/tweet?hashtags=TaNiM&related=freecodecamp&text='+quote.quote} rel="noreferrer" id="tweet-quote" target="_blank" className={'border-2 px-1 border-current rounded-lg '+color}>tweet-quote</a>
                <button id="new-quote" onClick={this.randomIndex} className={'border-2 px-1 border-current rounded-lg '+color}> New quote </button>  
              </div>
          </div>
        }
          <div className="flex items-center content-center mt-4 ">
            <input value={this.state.input} onKeyPress={(e) => e.code==="Enter"?window.location.href = 'https://www.google.com/search?q='+this.state.input:""} onChange={this.handleChange} placeholder="Google Search" className={"shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-gray-500 focus:shadow-outline"}></input>
          <button className={'bg-gray-50 font-bold rounded-lg  py-2 px-3 mx-2 '+color} onClick={()=>window.location.href = 'https://www.google.com/search?q='+this.state.input} >Search</button>
          </div>
        </div>
    );
  }
};

export default App;
