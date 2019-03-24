precision mediump float;

varying vec2 texCoords;
uniform sampler2D textureSampler;
uniform highp vec4 impairmentVector[4];

void main() {
    vec4 color = texture2D(textureSampler, texCoords);

    float colorR = ( color.r*impairmentVector[0].r ) + ( color.g*impairmentVector[0].g ) + ( color.b*impairmentVector[0].b );
    float colorG = ( color.r*impairmentVector[1].r ) + ( color.g*impairmentVector[1].g ) + ( color.b*impairmentVector[1].b );
    float colorB = ( color.r*impairmentVector[2].r ) + ( color.g*impairmentVector[2].g ) + ( color.b*impairmentVector[2].b );

    color.r = colorR;
    color.g = colorG;
    color.b = colorB;

    gl_FragColor = color;
}