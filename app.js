const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#f5deb3',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let synth, hiHat, snare, kick, melodySynth;
let chords = [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['C3', 'E3', 'G3'], ['G3', 'B3', 'D4']];
let scale = ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4','A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'];
let melodyIndex = 0;
let isMelodyPlaying = false;
let bpm = 100;
let loopEvent;
let bpmText, synthVolumeText, melodyVolumeText, hiHatVolumeText, snareVolumeText, kickVolumeText;

function preload() {
    this.load.image('button', 'button-image.png');
}

function create() {
    bpmText = this.add.text(10, 10, `BPM: ${bpm}`, { fontSize: '16px', fill: '#000' });
    synthVolumeText = this.add.text(10, 30, '', { fontSize: '16px', fill: '#000' });
    melodyVolumeText = this.add.text(10, 50, '', { fontSize: '16px', fill: '#000' });
    hiHatVolumeText = this.add.text(10, 70, '', { fontSize: '16px', fill: '#000' });
    snareVolumeText = this.add.text(10, 90, '', { fontSize: '16px', fill: '#000' });
    kickVolumeText = this.add.text(10, 110, '', { fontSize: '16px', fill: '#000' });

    synth = new Tone.PolySynth(Tone.Synth).toDestination();
    synth.volume.value = -20;
    melodySynth = new Tone.PolySynth(Tone.Synth).toDestination();
    melodySynth.volume.value = -10;
    hiHat = new Tone.NoiseSynth({
        volume: -10,
        envelope: {
            attack: 0.01,
            decay: 0.1
        },
        filterEnvelope: {
            attack: 0.01,
            decay: 0.1,
            baseFrequency: 6000,
            octaves: -2.5
        }
    }).toDestination();
    snare = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: {
            type: "sine"
        },
        envelope: {
            attack: 0.001,
            decay: 0.2,
            sustain: 0.01,
            release: 0.2,
            attackCurve: "exponential"
        }
    }).toDestination();
    kick = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: {
            type: "sine"
        },
        envelope: {
            attack: 0.001,
            decay: 0.8,
            sustain: 0.01,
            release: 1.4,
            attackCurve: "exponential"
        }
    }).toDestination();
    
    let button1 = this.add.sprite(150, 300, 'button').setInteractive();
    button1.on('pointerdown', async function () {
        await Tone.start();
        if (!isMelodyPlaying) {
            isMelodyPlaying = true;
            startMelodyLoop();
        }
    });
    let button2 = this.add.sprite(300, 300, 'button').setInteractive();
    button2.on('pointerdown', async function () {
        if (isMelodyPlaying) {
            isMelodyPlaying = false;
            Tone.Transport.stop();
        }
    });
    let button3 = this.add.sprite(450, 300, 'button').setInteractive();
    button3.on('pointerdown', function () {
        if(bpm < 180){
            bpm += 10;
            Tone.Transport.bpm.rampTo(bpm, 0.5); // The second parameter is the ramp time in seconds.
            kick.volume.value += 1;
            synth.volume.value -= 5;
            hiHat.volume.value -= 5;
            snare.volume.value -= 5;
            melodySynth.volume.value -= 5
        }
        else{
            synth.volume.value = -Infinity;
            hiHat.volume.value = -Infinity;
            snare.volume.value = -Infinity;
            melodySynth.volume.value = -Infinity
        }
    });
    let button4 = this.add.sprite(600, 300, 'button').setInteractive();
    button4.on('pointerdown', function () {
        if(bpm == 180){
            synth.volume.value = -55;
            hiHat.volume.value = -55;
            snare.volume.value = -55;
            melodySynth.volume.value = -55;
            kick.volume.value = 9;
        }
        if(bpm > 20){
            bpm -= 10;
            Tone.Transport.bpm.rampTo(bpm, 0.5); // The second parameter is the ramp time in seconds.
            if(bpm != 100){
                kick.volume.value -= 1;
                synth.volume.value += 5;
                hiHat.volume.value += 5;
                snare.volume.value += 5;
                melodySynth.volume.value +=5;
            }
        }
    });
}

function randomMelodyNote() {
    let noteIndex = Math.floor(Math.random() * scale.length);
    return scale[noteIndex];
}

function startMelodyLoop() {
    let noteDuration = 60 / bpm;
    let halfNoteDuration = noteDuration / 2;
    loopEvent = Tone.Transport.scheduleRepeat(time => {
        let chord = chords[melodyIndex % chords.length];
        chord.forEach(note => {
            synth.triggerAttackRelease(note, noteDuration, time);
        });
        melodySynth.triggerAttackRelease(randomMelodyNote(), noteDuration, time);
        hiHat.triggerAttackRelease("8n", time);
        hiHat.triggerAttackRelease("8n", time + halfNoteDuration);
        snare.triggerAttackRelease("8n", time + noteDuration / 2);
        kick.triggerAttackRelease("8n", time + noteDuration);
        melodyIndex++;
    }, noteDuration + 's');
    Tone.Transport.start();
}

function update() {
    bpmText.setText(`BPM: ${bpm}`);
    synthVolumeText.setText(`Synth Volume: ${synth.volume.value.toFixed(2)}`);
    melodyVolumeText.setText(`Melody Volume: ${melodySynth.volume.value.toFixed(2)}`);
    hiHatVolumeText.setText(`Hi-Hat Volume: ${hiHat.volume.value.toFixed(2)}`);
    snareVolumeText.setText(`Snare Volume: ${snare.volume.value.toFixed(2)}`);
    kickVolumeText.setText(`Kick Volume: ${kick.volume.value.toFixed(2)}`);
}

let game = new Phaser.Game(config);
