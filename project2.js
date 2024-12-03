/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {

	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {


		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');

		this.colorLoc = gl.getUniformLocation(this.prog, 'color');

		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');


		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();
		this.modelInvLoc = gl.getUniformLocation(this.prog, 'modelInv');
		this.numTriangles = 0;

		/**
		 * @Task2 : You should initialize the required variables for lighting here
		 */

		// Add lighting uniforms
		this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
		this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');
		this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');

		// Add normal buffer and location
		this.normalbuffer = gl.createBuffer();
		this.normalLoc = gl.getAttribLocation(this.prog, 'normal');

		// Initialize lighting state
		this.lightingEnabled = false;
		this.ambientIntensity = 0.5;

		this.specularLoc = gl.getUniformLocation(this.prog, 'specular');
		this.viewPosLoc = gl.getUniformLocation(this.prog, 'viewPos');
		this.specularIntensity = 0.5;

		

	}

	setSpecularLight(intensity) {
		this.specularIntensity = intensity;
		gl.useProgram(this.prog);
		gl.uniform1f(this.specularLoc, intensity);
	}



	setMesh(vertPos, texCoords, normalCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;

		// Setup normals
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;
	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		const modelInv = [
			trans[0], trans[4], trans[8], 0,   // Transpose of rotation matrix
			trans[1], trans[5], trans[9], 0,
			trans[2], trans[6], trans[10], 0,
			0, 0, 0, 1
		];

		gl.useProgram(this.prog);
		gl.uniformMatrix4fv(this.modelInvLoc, false, modelInv);
		gl.uniformMatrix4fv(this.mvpLoc, false, trans);


		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

		/**
		 * @Task2 : You should update this function to handle the lighting
		 */

		///////////////////////////////



		// Normal attribute
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
		gl.enableVertexAttribArray(this.normalLoc);
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);

		// Update lighting uniforms
		gl.uniform3f(this.lightPosLoc, lightX, lightY, -5.0);
		console.log(`Light Position: (${lightX}, ${lightY}, 5.0)`);
		gl.uniform1f(this.ambientLoc, this.ambientIntensity);
		gl.uniform1i(this.enableLightingLoc, this.lightingEnabled);

		gl.uniform3f(this.viewPosLoc, 0, 0, 5); // Camera position
		gl.uniform1f(this.specularLoc, this.specularIntensity);

		// Calculate inverse model matrix from MVP
	
		gl.uniformMatrix4fv(this.modelInvLoc, false, modelInv);
		updateLightPos();

		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);

	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		// You can set the texture image data using the following command.
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			img);

		// Set texture parameters 
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			console.error("Task 1: Non power of 2, you should implement this part to accept non power of 2 sized textures");
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		}

		gl.useProgram(this.prog);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		const sampler = gl.getUniformLocation(this.prog, 'tex');
		gl.uniform1i(sampler, 0);
	}

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}

	enableLighting(show) {
		this.lightingEnabled = show;
		gl.useProgram(this.prog);
		gl.uniform1i(this.enableLightingLoc, show);
	}

	setAmbientLight(ambient) {
		this.ambientIntensity = ambient;
		gl.useProgram(this.prog);
		gl.uniform1f(this.ambientLoc, ambient);
	}
}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 

			void main()
			{
				v_texCoord = texCoord;
				v_normal = normal;

				gl_Position = mvp * vec4(pos,1);
			}`;

// Fragment shader source code
/**
 * @Task2 : You should update the fragment shader to handle the lighting
 */
// Updated fragment shader
const meshFS = `
    precision mediump float;
    
    uniform bool showTex;
    uniform bool enableLighting;
    uniform sampler2D tex;
    uniform vec3 lightPos;
    uniform vec3 viewPos;
    uniform float ambient;
    uniform float specular;
    uniform mat4 modelInv;
    
    varying vec2 v_texCoord;
    varying vec3 v_normal;
    
    void main() {
        vec4 baseColor;
        if(showTex) {
            baseColor = texture2D(tex, v_texCoord);
        } else {
            baseColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
        
        if(enableLighting) {
            // Transform light position to object space
            vec3 lightPosObj = (modelInv * vec4(lightPos, 1.0)).xyz;
            
            vec3 normal = normalize(v_normal);
            vec3 lightDir = normalize(lightPosObj);
            vec3 viewDir = normalize((modelInv * vec4(viewPos, 1.0)).xyz);
            
            // Ambient
            vec3 ambient_color = ambient * baseColor.rgb;
            
            // Diffuse
            float diff = max(dot(normal, lightDir), 0.0);
            vec3 diffuse_color = diff * baseColor.rgb;
            
            // Specular - increased power and intensity
            vec3 reflectDir = reflect(lightDir, normal);
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), 64.0); // Increased shininess
            vec3 specular_color = specular * spec * vec3(1.0, 1.0, 1.0); // Bright white specular
            
            gl_FragColor = vec4(ambient_color + diffuse_color + specular_color, baseColor.a);
        } else {
            gl_FragColor = baseColor;
        }
    }
`;

// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
	const translationSpeed = 1;
	if (keys['ArrowUp']) lightY -= translationSpeed;
	if (keys['ArrowDown']) lightY += translationSpeed;
	if (keys['ArrowRight']) lightX -= translationSpeed;
	if (keys['ArrowLeft']) lightX += translationSpeed;

}
///////////////////////////////////////////////////////////////////////////////////