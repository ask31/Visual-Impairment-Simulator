// After the page has loaded, initialise the class.
jQuery( document ).ready( () => {
	// Initialise the class, see constructor.
    let blind = new VisualImpairmentSimulator();
} );

class VisualImpairmentSimulator {

    /**
     * Constructor function, called when the class is initialised.
     */
    constructor() {
        // Set default impairment vectors
        this.impairmentVectors = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

        // Set default image
        this.imgSrc = './image3.jpg';

        // Initialise hooks callbacks, page state etc.
        this.init();
    }

    /**
     * Add callbacks for user input, load our shader data into javascript etc.
     */
    init() {
        // Load shaders into javascript - triggers the initial image render
        this.loadShaders();

        jQuery('.splash-screen .load-app').click(() => {
            jQuery('body').addClass('in-app');
        });

        // For every impairment select button, add a click event handler. Every time user clicks a button, trigger onImpairmentSelect.
        jQuery('.impairment-select li').click((e) => {
            // Trigger the callback.
            this.onImpairmentSelect(e.target);
        });

        // When the user sets a new image on the file upload handler, trigger onImageSelect.
        jQuery('.image-select').change((e) => {
            this.onImageSelect(e.target);
        });

        this.canvas = document.createElement('canvas');
        jQuery('.canvas-wrap').append(this.canvas);
    }

    /**
     * Callback function for when the user selects an impairment.
     *
     * @param element
     */
    onImpairmentSelect(element) {
        this.impairmentVectors = JSON.parse(element.dataset.vector);
        // Triggers doRender to reload the image and apply image filters.
        this.doRender();
    }

    /**
     * Callback function for when the user selects an image.
     *
     * @param element
     */
    onImageSelect(element) {
        // Create a temporary url for the user supplied image object, this url can then be used for the image src.
        this.imgSrc = URL.createObjectURL(element.files[0]);
        // Do a render.
        this.doRender();
    }

    /**
     * Do a render of an image using webGL canvas with the visual impairment filters applied via glsl shaders
     */
    doRender() {
        // Create a new image element
        this.image = new Image();
        this.image.src = this.imgSrc;
        // Trigger the canvas creation `afterImageLoad` callback after the element is loaded
        this.image.onload = () => this.afterImageLoad();
    }

    /**
     * Create a canvas element on the page using webGL rendering.
     *
     * Applies vertex and frag shaders with selected or default impairment matrix
     */
    afterImageLoad() {

        this.canvas.width = this.image.naturalWidth;
        this.canvas.height = this.image.naturalHeight;

        const gl = this.canvas.getContext('webgl');

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(1.0, 0.8, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const vertShader = gl.createShader(gl.VERTEX_SHADER);
        const fragShader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(vertShader, this.vertShaderSource);
        gl.shaderSource(fragShader, this.fragShaderSource);

        gl.compileShader(vertShader);
        gl.compileShader(fragShader);

        /**
         * If there is an error when applying the vertex shader, log it in the console.
         */
        if (gl.getShaderInfoLog(vertShader)) {
            console.log(gl.getShaderInfoLog(vertShader));
        }

        /**
         * If there is an error when applying the frag shader, log it in the console.
         */
        if (gl.getShaderInfoLog(fragShader)) {
            console.log(gl.getShaderInfoLog(fragShader));
        }

        const program = gl.createProgram();

        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);

        gl.linkProgram(program);

        gl.useProgram(program);

        const vertices = new Float32Array([
            -1, -1,
            -1, 1,
            1, 1,

            -1, -1,
            1, 1,
            1, -1,
        ]);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, 'position');

        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLocation);

        console.log(this.impairmentVectors);

        //Use getUniformLocation for passing blindness vector into frag shader
         const impairmentVectorLocation = gl.getUniformLocation(program, 'impairmentVector');
         gl.uniform4fv(impairmentVectorLocation, this.impairmentVectors );


         const texture = gl.createTexture();
         gl.activeTexture(gl.TEXTURE0);
         gl.bindTexture(gl.TEXTURE_2D, texture);
         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);

         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

         gl.drawArrays(gl.TRIANGLES, 0, 6);
         }

         /**
         * Load our vertex and frag shaders into javascript so that they can be applied to the webGL canvas render.
         */
        loadShaders()
        {
            // Ajax requests are parallel, value must be collected in an async callback.
            $.ajax({
                url: 'shaders/frag-shader.glsl'
            }).done((fragShaderContent) => {
                this.fragShaderSource = fragShaderContent;

                // Ajax requests are parallel, value must be collected in an async callback.
                $.ajax({
                    url: 'shaders/vert-shader.glsl'
                }).done((vertShaderContent) => {
                    this.vertShaderSource = vertShaderContent;
                    // Once the shader is loaded in, trigger an initial render to make sure we start with a working render
                    this.doRender();
                });
            });
        }
    }
