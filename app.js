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

// A minor
let chords = [['A4', 'C4', 'E4'], ['F3', 'A4', 'C4'], ['C4', 'E3', 'G3'], ['G3', 'B4', 'D4']];
let scale = ['A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3','A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4'];

// Song init.
let melodyIndex = 0;
let isMelodyPlaying = false;
let bpm = 110;
let masterTempo = 110;
let loopEvent;

let defaultVolumes = {
    'synth': -15,
    'melodySynth': -15,
    'hiHat': -25,
    'snare': -15,
    'kick': 0
};

// Synths
let synth, hiHat, snare, kick, melodySynth;

let bpmText, synthVolumeText, melodyVolumeText, hiHatVolumeText, snareVolumeText, kickVolumeText;

function preload() {
    this.load.image('button', 'button-image.png');
}

function create() {

    // Text fields
    bpmText = this.add.text(10, 10, `BPM: ${bpm}`, { fontSize: '16px', fill: '#000' });
    synthVolumeText = this.add.text(10, 30, '', { fontSize: '16px', fill: '#000' });
    melodyVolumeText = this.add.text(10, 50, '', { fontSize: '16px', fill: '#000' });
    hiHatVolumeText = this.add.text(10, 70, '', { fontSize: '16px', fill: '#000' });
    snareVolumeText = this.add.text(10, 90, '', { fontSize: '16px', fill: '#000' });
    kickVolumeText = this.add.text(10, 110, '', { fontSize: '16px', fill: '#000' });


    // Chord synth
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
    synth.volume.value = defaultVolumes['synth'];

    // Melody synth
    melodySynth = new Tone.PolySynth(Tone.Synth).toDestination();
    melodySynth.volume.value = defaultVolumes['melodySynth'];

    // hh synth
    hiHat = new Tone.NoiseSynth({
        volume: defaultVolumes['hiHat'],
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

    // snare synth
    snare = new Tone.MembraneSynth({
        volume: defaultVolumes['snare'],
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

    // kick synth
    kick = new Tone.MembraneSynth({
        volume: defaultVolumes['kick'],
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
    
    // Start track
    let button1 = this.add.sprite(150, 300, 'button').setInteractive();
    button1.on('pointerdown', async function () {
        await Tone.start();
        if (!isMelodyPlaying) {
            isMelodyPlaying = true;
            startMelodyLoop();
        }
    });

    // Stop track
    let button2 = this.add.sprite(300, 300, 'button').setInteractive();
    button2.on('pointerdown', async function () {
        if (isMelodyPlaying) {
            isMelodyPlaying = false;
            Tone.Transport.cancel(0);
            Tone.Transport.stop();
        }
    });

    // Ramp up
    let button3 = this.add.sprite(450, 300, 'button').setInteractive();
    button3.on('pointerdown', function () {
        if(bpm < 200){
            Tone.Transport.bpm.rampTo(masterTempo + 100, 0.5);
            rampDownVolumes();
        }
    });

    // Ramp down
    let button4 = this.add.sprite(600, 300, 'button').setInteractive();
    button4.on('pointerdown', function () {
        if(bpm != 0){
            Tone.Transport.bpm.rampTo(masterTempo, ); // The second parameter is the ramp time in seconds.
            rampUpVolumes();
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

function rampUpVolumes() {
    synth.volume.rampTo(defaultVolumes['synth'] + 5, 0.5);
    melodySynth.volume.rampTo(defaultVolumes['melodySynth'] + 5, 0.5);
    hiHat.volume.rampTo(defaultVolumes['hiHat'] + 5, 0.5);
    snare.volume.rampTo(defaultVolumes['snare'] + 5, 0.5);
    //kick.volume.rampTo(defaultVolumes['kick'] + 5, 0.5);
}

function rampDownVolumes() {
    synth.volume.rampTo(-Infinity, 2);
    melodySynth.volume.rampTo(-Infinity, 2);
    hiHat.volume.rampTo(-Infinity, 2);
    snare.volume.rampTo(-Infinity, 2);
   //kick.volume.rampTo(defaultVolumes['kick'], 2);
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
