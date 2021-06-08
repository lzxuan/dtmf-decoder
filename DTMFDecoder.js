// Modified from https://github.com/Ravenstine/goertzeljs/blob/master/lib/dtmf.js

class DTMFDecoder {
  constructor({ energyThreshold = 0, sampleRate = 44100 } = {}) {
    this.energyThreshold = energyThreshold;
    this.frequencyTable = {
      697: {
        1209: '1',
        1336: '2',
        1477: '3',
        1633: 'A'
      },
      770: {
        1209: '4',
        1336: '5',
        1477: '6',
        1633: 'B'
      },
      852: {
        1209: '7',
        1336: '8',
        1477: '9',
        1633: 'C'
      },
      941: {
        1209: '*',
        1336: '0',
        1477: '#',
        1633: 'D'
      }
    };
    this.lowFrequencies = [];
    for (var key in this.frequencyTable) {
      this.lowFrequencies.push(parseInt(key));
    }
    this.highFrequencies = [];
    for (var key in this.frequencyTable[this.lowFrequencies[0]]) {
      this.highFrequencies.push(parseInt(key));
    }
    this.allFrequencies = this.lowFrequencies.concat(this.highFrequencies);
    this.goertzel = new Goertzel({
      frequencies: this.allFrequencies,
      sampleRate: sampleRate
    });
  }

  processBuffer(buffer) {
    const bufferSize = buffer.length;
    buffer.forEach((sample, index) => {
      this.goertzel.processSample(this._exactBlackmanWindow(sample, index, bufferSize));
    });
    let character = this._energyProfileToCharacter(this.goertzel.energies);
    this.goertzel.refresh();
    return character;
  }

  // private

  _exactBlackmanWindow(sample, sampleIndex, bufferSize) {
    return sample * (
      0.426591 -
      (0.496561 * Math.cos((2 * Math.PI * sampleIndex) / bufferSize)) +
      (0.076849 * Math.cos((4 * Math.PI * sampleIndex) / bufferSize))
    );
  }

  _energyProfileToCharacter(energies) {
    let lowFrequency = 0;
    let lowFrequencyEnergy = 0;
    this.lowFrequencies.forEach(f => {
      if (energies[f] > lowFrequencyEnergy && energies[f] >= this.energyThreshold) {
        lowFrequencyEnergy = energies[f];
        lowFrequency = f;
      }
    });
    if (!lowFrequency) return '';
    let highFrequency = 0;
    let highFrequencyEnergy = 0;
    this.highFrequencies.forEach(f => {
      if (energies[f] > highFrequencyEnergy && energies[f] >= this.energyThreshold) {
        highFrequencyEnergy = energies[f];
        highFrequency = f;
      }
    });
    if (!highFrequency) return '';
    return this.frequencyTable[lowFrequency][highFrequency];
  }
}
