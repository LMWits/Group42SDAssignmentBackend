document.getElementById("uploadForm").addEventListener("submit", async function (e) 
{
    e.preventDefault();
  
    const data=new FormData(this);
  
    const response=await fetch('/api/upload',
    {
      method: 'POST',
      body: data
    });
  
    const ans=await response.json();
    document.getElementById("status").innerText=ans.message;
  });
  