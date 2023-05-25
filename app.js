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

let chords = [['A4', 'C4', 'E4'], ['F3', 'A4', 'C4'], ['C4', 'E3', 'G3'], ['G3', 'B4', 'D4']];
let scale = ['A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3','A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4'];

let melodyIndex = 0;
let isMelodyPlaying = false;
let bpm = 80;
let masterTempo = 80;
let loopEvent;

let defaultVolumes = {
    'synth': -15,
    'melodySynth': -15,
    'hiHat': -25,
    'snare': -15,
    'kick': 0
};

let synth, hiHat, snare, kick, melodySynth;
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
    synth.volume.value = defaultVolumes['synth'];

    melodySynth = new Tone.PolySynth(Tone.Synth).toDestination();
    melodySynth.volume.value = defaultVolumes['melodySynth'];

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

    let button1 = this.add.sprite(150, 300, 'button').setInteractive();
    button1.on('pointerdown', async function () {
        await Tone.start();
        Tone.Transport.bpm.value = masterTempo;
        if (!isMelodyPlaying) {
            isMelodyPlaying = true;
            startMelodyLoop();
        }
    });

    let button2 = this.add.sprite(300, 300, 'button').setInteractive();
    button2.on('pointerdown', async function () {
        if (isMelodyPlaying) {
            isMelodyPlaying = false;
            Tone.Transport.cancel(0);
            Tone.Transport.stop();
            if (loopEvent) {
                loopEvent.stop();
            }
        }
    });

    let button3 = this.add.sprite(450, 300, 'button').setInteractive();
    button3.on('pointerdown', function () {
        if(bpm < 200){
            Tone.Transport.bpm.rampTo(masterTempo + 200, 2);
            rampDownVolumes();
        }
    });

    let button4 = this.add.sprite(600, 300, 'button').setInteractive();
    button4.on('pointerdown', function () {
        if(bpm != 0){
            Tone.Transport.bpm.rampTo(masterTempo, 2);
            rampUpVolumes();
        }
    });
}

function randomMelodyNote() {
    let noteIndex = Math.floor(Math.random() * scale.length);
    return scale[noteIndex];
}

function startMelodyLoop() {
    let loop = new Tone.Loop((time) => {
        let noteDuration = "4n";
        let chord = chords[melodyIndex % chords.length];
        chord.forEach(note => {
            synth.triggerAttackRelease(note, noteDuration, time);
        });
        melodySynth.triggerAttackRelease(randomMelodyNote(), noteDuration, time);

        // Hi-Hat on every eighth note
        hiHat.triggerAttackRelease("8n", time);
        hiHat.triggerAttackRelease("8n", time + Tone.Time("8n").toSeconds());

        // Kick on the 1 and 3 (every other beat starting from 0)
        if (melodyIndex % 2 === 0) {
            kick.triggerAttackRelease(noteDuration, time);
        }

        // Snare on the 2 and 4 (every other beat starting from 1)
        else {
            snare.triggerAttackRelease(noteDuration, time);
        }

        melodyIndex++;
    }, "4n").start(0);

    Tone.Transport.start();
}



function rampUpVolumes() {
    synth.volume.rampTo(defaultVolumes['synth'], 3);
    melodySynth.volume.rampTo(defaultVolumes['melodySynth'], 3);
    hiHat.volume.rampTo(defaultVolumes['hiHat'], 3);
    snare.volume.rampTo(defaultVolumes['snare'], 3);
}

function rampDownVolumes() {
    synth.volume.rampTo(-Infinity, 6);
    melodySynth.volume.rampTo(-Infinity, 6);
    hiHat.volume.rampTo(-Infinity, 6);
    snare.volume.rampTo(-Infinity, 6);
}

function update() {
    bpm = Tone.Transport.bpm.value;
    bpmText.setText(`BPM: ${bpm.toFixed(2)}`);
    synthVolumeText.setText(`Synth Volume: ${synth.volume.value.toFixed(2)}`);
    melodyVolumeText.setText(`Melody Volume: ${melodySynth.volume.value.toFixed(2)}`);
    hiHatVolumeText.setText(`HiHat Volume: ${hiHat.volume.value.toFixed(2)}`);
    snareVolumeText.setText(`Snare Volume: ${snare.volume.value.toFixed(2)}`);
    kickVolumeText.setText(`Kick Volume: ${kick.volume.value.toFixed(2)}`);
}

const game = new Phaser.Game(config);
