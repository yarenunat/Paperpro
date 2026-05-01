let db;
const req = indexedDB.open("paperDB",1);
req.onupgradeneeded=e=>{
 db=e.target.result;
 db.createObjectStore("pages",{autoIncrement:true});
};
req.onsuccess=e=>db=e.target.result;

function savePage(data){
 const tx=db.transaction("pages","readwrite");
 tx.objectStore("pages").add(data);
}
