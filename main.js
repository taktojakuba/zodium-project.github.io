function showsection(id) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    // show selected
    document.getElementById(id).style.display = 'block';
    //debug 
    console.log(id)
    console.log(document.getElementById(id).style.display)
}
function shownav(id) {
    const nav = document.querySelectorAll('.nav-links');
    nav.forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById('homebutton').style.display='block';
    // show selected
    document.getElementById(id).style.display = 'block';
    //debug 
    console.log(id)
    console.log(document.getElementById(id).style.display)
}
function hidebar() {
    document.getElementById('sidebar').style.display = 'none';  
    document.querySelector('.main-content').classList.remove('sidebar-open');
}

function showbar() {
    document.getElementById('sidebar').style.display = 'flex';
    document.querySelector('.main-content').classList.add('sidebar-open');
}