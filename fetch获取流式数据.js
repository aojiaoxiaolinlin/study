fetch("http://localhost:8080/flux/dataStream2").then(res=>{
    if(res.ok){
        const reader =  res.body.getReader();
        streamParse(reader);
    }
}).catch(error=>{
    console.log(error)
})
function streamParse(reader){
    const textDecoder = new TextDecoder();
    reader.read().then(data=>{
        if(data.done) return;
        const chunk = textDecoder.decode(data.value)
        console.log(chunk)
        streamParse(reader)
    }).catch(error => {
        console.error('Error reading stream:', error);
    });
}
