"use strict";

let STRING_ERROR = "ERROR: Please check that the model is a STL, OBJ or 3DS model.";
let container, camera, scene, renderer, controls, light, vol, mesh, height, heightFinal, width, widthFinal, depth, depthFinal;

let density = parseFloat("1.05");
let filament_cost = parseFloat("20");
let filament_diameter = parseFloat("1.75");
let printing_speed = parseFloat("150");

const print2aApiHost = 'https://print2a.com'
const print2aApiPort = '5757'
const print2aApiEndpoint = `${print2aApiHost}:${print2aApiPort}`

document.getElementById("densityLabel").innerHTML = "Density";
document.getElementById("weightLabel").innerHTML = "Weight";
document.getElementById("volumeLabel").innerHTML = "Volume";
document.getElementById("sizeLabel").innerHTML = "Size";
document.getElementById("costKilogramLabel").innerHTML = "Filament cost per kilogram";
document.getElementById("costLabel").innerHTML = "Printing cost";
document.getElementById("diameterLabel").innerHTML = "Filament diameter";
document.getElementById("speedLabel").innerHTML = "Printing speed";
document.getElementById("lengthLabel").innerHTML = "Filament length";
document.getElementById("timeLabel").innerHTML = "Build time";
document.getElementById("hoursLabel").innerHTML = "hours";
document.getElementById("minutesLabel").innerHTML = "minutes";

function init(fileExt, fileData) {
    container = document.getElementById("container");
    container.innerHTML = "";

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100000);

    camera.position.z = 300;
    camera.position.y = -500;
    camera.position.x = -500;
    camera.up = new THREE.Vector3(0, 0, 1);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    document.getElementById("container2").style.display = "none";

    if (fileExt === "stl") {
        // SHOWING THE LOADING SPLASH
        document.getElementById("loading").style.display = "block";
    }
    else if (fileExt === "3ds") {
        // SHOWING THE LOADING SPLASH
        document.getElementById("loading").style.display = "block";
    }
    else if (fileExt === "obj") {
        // SHOWING THE LOADING SPLASH
        document.getElementById("loading").style.display = "block";
    }
    else {
        // HIDDING THE LOADING SPLASH
        document.getElementById("loading").style.display = "none";

        document.getElementById("container2").style.display = "none";
        console.log("EXT: ",fileExt)
        alert(STRING_ERROR);
    }
    
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
        try {
            let contents = fileData;
            console.log("LOAD: ",contents);
            if (fileExt === "obj") {
                let object = new THREE.OBJLoader().parse(contents);
                let sceneConverter = new THREE.Scene();
                sceneConverter.add(object);
                let exporter = new THREE.STLExporter();
                contents = exporter.parse(sceneConverter);
            }
            else if (fileExt === "3ds") {
                let object = new THREE.TDSLoader().parse(contents);
                let sceneConverter = new THREE.Scene();
                sceneConverter.add(object);
                let exporter = new THREE.STLExporter();
                contents = exporter.parse(sceneConverter);
            }

            let geometry = new THREE.STLLoader().parse(contents);
            geometry.computeFaceNormals();
            geometry.computeVertexNormals();
            geometry.center();

            let material = new THREE.MeshPhongMaterial({ color: 0x00FF00, emissive:0x000000, emissiveIntensity:2});
            mesh = new THREE.Mesh(geometry, material);

            // CALCULATING THE VOLUME
            vol = 0;

            mesh.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    let positions = child.geometry.getAttribute("position").array;
                    for (let i = 0; i < positions.length; i += 9) {
                        let t1 = {};
                        t1.x = positions[i + 0];
                        t1.y = positions[i + 1];
                        t1.z = positions[i + 2];

                        let t2 = {};
                        t2.x = positions[i + 3];
                        t2.y = positions[i + 4];
                        t2.z = positions[i + 5];

                        let t3 = {};
                        t3.x = positions[i + 6];
                        t3.y = positions[i + 7];
                        t3.z = positions[i + 8];

                        vol += signedVolumeOfTriangle(t1, t2, t3);
                    }
                }
            });

            let box = new THREE.Box3().setFromObject(mesh);

            height = box.max.z - box.min.z;
            width = box.max.x - box.min.x;
            depth = box.max.y - box.min.y;

            heightFinal = height / 10; heightFinal = heightFinal.toFixed(2);
            widthFinal = width / 10; widthFinal = widthFinal.toFixed(2);
            depthFinal = depth / 10; depthFinal = depthFinal.toFixed(2);
            let volumeFinal = vol / 1000; volumeFinal = volumeFinal.toFixed(2);
            let weightFinal = volumeFinal * density; weightFinal = weightFinal.toFixed(2);

            let filament_length = parseFloat((vol / (filament_diameter / 2) ^ 2 / Math.PI) * 2 / 10).toFixed(2);
            filament_length = parseFloat(filament_length).toFixed(0);

            let hours = Math.floor((filament_length / printing_speed) / 60);
            hours = parseFloat(hours).toFixed(0);

            let minutes = (filament_length / printing_speed) % 60;
            minutes = parseFloat(minutes).toFixed(0);

            if (minutes == 0) { minutes = 1; }

            let finalCost = weightFinal * filament_cost / 1000;
            finalCost = parseFloat(finalCost).toFixed(2);

            document.getElementById("container2").style.display = "block";
            document.getElementById("densityValue").innerHTML = density;
            document.getElementById("weightValue").innerHTML = weightFinal;
            document.getElementById("volumeValue").innerHTML = volumeFinal;
            document.getElementById("widthValue").innerHTML = widthFinal;
            document.getElementById("depthValue").innerHTML = depthFinal;
            document.getElementById("heightValue").innerHTML = heightFinal;
            document.getElementById("costKilogramValue").innerHTML = filament_cost;
            document.getElementById("costValue").innerHTML = finalCost;
            document.getElementById("diameterValue").innerHTML = filament_diameter;
            document.getElementById("speedValue").innerHTML = printing_speed;
            document.getElementById("lengthValue").innerHTML = filament_length;
            document.getElementById("hoursValue").innerHTML = hours;
            document.getElementById("minutesValue").innerHTML = minutes;

            let distance;

            if (height > width && height > depth) {
                distance = height * 2;
            }
            else if (width > height && width > depth) {
                distance = width * 2;
            }
            else if (depth > height && depth > width) {
                distance = depth * 2;
            }
            else {
                distance = depth * 4;
            }

            camera.position.set(0, -distance, 0);

            let x = distance + 200;
            let y = distance + 200;
            let division_x = Math.floor(x / 10);
            let division_y = Math.floor(y / 10);

            // AN ALTERNATIVE FOR MOVING THE OBJECT USING THE MOUSE WITHIN THE RENDERER
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            // controls = new THREE.OrbitControls(camera);
            function animateSpin(){
                controls.update();
                requestAnimationFrame ( animateSpin );  
                renderer.render (scene, camera);
            }
            controls.update();
            console.log(controls);
            scene.add(mesh);
            controls.autoRotate = true;
            animateSpin();
            // HIDDING THE LOADING SPLASH
            document.getElementById("loading").style.display = "none";
        }
        catch (err) {
            // HIDDING THE LOADING SPLASH
            document.getElementById("loading").style.display = "none";

            document.getElementById("container2").style.display = "none";
            console.log(err)
            alert(STRING_ERROR);
        }

    light = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
    light.position.set(0, 1, 0);
    scene.add(light);

    container.appendChild(renderer.domElement);

    requestAnimationFrame(animate);

    window.addEventListener("resize", onWindowResize, false);
}

function animate() {
    requestAnimationFrame(animate);
    light.position.copy(camera.getWorldPosition());
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function moreDensity(a) {
    let result;
    if (a == true) {
        result = parseFloat(density) + parseFloat("0.05");
        if (result <= 10000) {
            density = result;
        }
    }
    else {
        result = parseFloat(density) - parseFloat("0.05");
        if (result > 0) {
            density = result;
        }
    }

    density = parseFloat(density).toFixed(2);

    let heightFinal = height / 10; heightFinal = heightFinal.toFixed(2);
    let widthFinal = width / 10; widthFinal = widthFinal.toFixed(2);
    let depthFinal = depth / 10; depthFinal = depthFinal.toFixed(2);
    let volumeFinal = vol / 1000; volumeFinal = volumeFinal.toFixed(2);
    let weightFinal = volumeFinal * density; weightFinal = weightFinal.toFixed(2);

    document.getElementById("densityValue").innerHTML = density;
    document.getElementById("weightValue").innerHTML = weightFinal;
    document.getElementById("volumeValue").innerHTML = volumeFinal;
    document.getElementById("widthValue").innerHTML = widthFinal;
    document.getElementById("depthValue").innerHTML = depthFinal;
    document.getElementById("heightValue").innerHTML = heightFinal;
    updateCost();
}

function moreCost(a) {
    let result;
    if (a == true) {
        result = parseFloat(filament_cost) + parseFloat("5");
        if (result <= 10000) {
            filament_cost = result;
        }
    }
    else {
        result = parseFloat(filament_cost) - parseFloat("5");
        if (result > 0) {
            filament_cost = result;
        }
    }
    document.getElementById("costKilogramValue").innerHTML = filament_cost;

    updateCost();
}

function updateCost() {
    let volumeFinal = vol / 1000;
    volumeFinal = volumeFinal.toFixed(2);
    let weightFinal = volumeFinal * density; weightFinal = weightFinal.toFixed(2);
    let finalCost = weightFinal * filament_cost / 1000;
    finalCost = parseFloat(finalCost).toFixed(2);
    document.getElementById("costValue").innerHTML = finalCost;
}

function moreDiameter(a) {
    let result;
    if (a == true) {
        result = parseFloat(filament_diameter) + parseFloat("0.05");
        if (result <= 10000) {
            filament_diameter = result;
        }
    }
    else {
        result = parseFloat(filament_diameter) - parseFloat("0.05");
        if (result > 0) {
            filament_diameter = result;
        }
    }

    filament_diameter = parseFloat(filament_diameter).toFixed(2);

    let filament_length = parseFloat((vol / (filament_diameter / 2) ^ 2 / Math.PI) * 2 / 10).toFixed(2);
    filament_length = parseFloat(filament_length).toFixed(0);

    let hours = Math.floor((filament_length / printing_speed) / 60);
    hours = parseFloat(hours).toFixed(0);

    let minutes = (filament_length / printing_speed) % 60;
    minutes = parseFloat(minutes).toFixed(0);

    if (minutes == 0) { minutes = 1; }

    document.getElementById("diameterValue").innerHTML = filament_diameter;
    document.getElementById("lengthValue").innerHTML = filament_length;
    document.getElementById("hoursValue").innerHTML = hours;
    document.getElementById("minutesValue").innerHTML = minutes;
}

function moreSpeed(a) {
    let result;
    if (a == true) {
        result = parseFloat(printing_speed) + parseFloat("5");
        if (result <= 10000) {
            printing_speed = result;
        }
    }
    else {
        result = parseFloat(printing_speed) - parseFloat("5");
        if (result > 0) {
            printing_speed = result;
        }
    }

    printing_speed = parseFloat(printing_speed).toFixed(0);

    let filament_length = parseFloat((vol / (filament_diameter / 2) ^ 2 / Math.PI) * 2 / 10).toFixed(2);

    let hours = Math.floor((filament_length / printing_speed) / 60);
    hours = parseFloat(hours).toFixed(0);

    let minutes = (filament_length / printing_speed) % 60;
    minutes = parseFloat(minutes).toFixed(0);

    document.getElementById("speedValue").innerHTML = printing_speed;
    document.getElementById("hoursValue").innerHTML = hours;
    document.getElementById("minutesValue").innerHTML = minutes;
}

window.onload = async function () {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let filePath = urlParams.get("fileLocation")
    let fileName = filePath.split('/').pop();
    let fileExt = fileName.split('.').pop().toLowerCase();
    let data = await fetch(
        `${print2aApiEndpoint}/GetFile?fileLocation=print2a/${filePath}`,
    )
    console.log(data)
    let fileData = await data.arrayBuffer()
    console.log(fileData)
    init(fileExt, fileData);
}