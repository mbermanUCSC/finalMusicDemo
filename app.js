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

let chords = [
    ['A4', 'C4', 'E4'],  // Am
    ['B4', 'D4', 'F4'],  // Bdim
    ['C4', 'E4', 'G4'],  // C
    ['D4', 'F4', 'A4'],  // Dm
    ['E4', 'G4', 'B4'],  // Em
    ['F4', 'A4', 'C5'],  // F
    ['G4', 'B4', 'D5'],  // G
    ['A5', 'C5', 'E5'],  // Am octave higher
    ['B5', 'D5', 'F5'],  // Bdim octave higher
    ['C5', 'E5', 'G5'],  // C octave higher
    ['D5', 'F5', 'A5'],  // Dm octave higher
    ['E5', 'G5', 'B5'],  // Em octave higher
    ['F5', 'A5', 'C6'],  // F octave higher
    ['G5', 'B5', 'D6'],  // G octave higher
];

let scale = ['A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3','A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4'];
let durations = ['4n', '8n', '2n']; 


let currentNote = 'A2';  // Starting note
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

let transitionMatrix = {
    'A2': { 'B2': 0.5, 'A2': 0.5 },
    'B2': { 'A2': 0.5, 'C3': 0.5 },
    'C3': { 'B2': 0.5, 'D3': 0.5 },
    'D3': { 'C3': 0.5, 'E3': 0.5 },
    'E3': { 'D3': 0.5, 'F3': 0.5 },
    'F3': { 'E3': 0.5, 'G3': 0.5 },
    'G3': { 'F3': 0.5, 'A3': 0.5 },
    'A3': { 'G3': 0.5, 'B3': 0.5 },
    'B3': { 'A3': 0.5, 'C4': 0.5 },
    'C4': { 'B3': 0.5, 'D4': 0.5 },
    'D4': { 'C4': 0.5, 'E4': 0.5 },
    'E4': { 'D4': 0.5, 'F4': 0.5 },
    'F4': { 'E4': 0.5, 'G4': 0.5 },
    'G4': { 'F4': 0.5, 'G4': 0.5 },
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
    let transitions = transitionMatrix[currentNote];
    let rand = Math.random();
    let cumulativeProbability = 0;

    for (let note in transitions) {
        cumulativeProbability += transitions[note];
        if (rand < cumulativeProbability) {
            currentNote = note;
            break;
        }
    }

    return currentNote;
}

function randomDuration() {
    let index = Math.floor(Math.random() * durations.length);
    return durations[index];
}


function startMelodyLoop() {
    let loop = new Tone.Loop((time) => {
        // Use random duration for the notes
        let noteDuration = randomDuration();

        // Select a random chord and trigger the notes
        let chord = chords[Math.floor(Math.random() * chords.length)];
        chord.forEach(note => {
            synth.triggerAttackRelease(note, noteDuration, time);
        });

        // Trigger the melody note with a random note and duration
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
