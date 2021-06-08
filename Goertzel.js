// Modified from https://github.com/Ravenstine/goertzeljs/blob/master/index.js

const GOERTZEL_ATTRIBUTES = [
  'firstPrevious',
  'secondPrevious',
  'totalPower',
  'filterLength',
  'energies'
];

/**
 * A pure JavaScript implementation of the Goertzel algorithm, a means of efficient DFT signal processing.
 * @param {array}  frequencies - The frequencies to be processed. Defaults to [].
 * @param {number} sampleRate  - The sample rate of the samples to be processed. Defaults to 44100.
 */
class Goertzel {
  constructor({ frequencies = [], sampleRate = 44100 } = {}) {
    this.frequencies = frequencies;
    this.sampleRate = sampleRate;
    this._initialize();
    this.refresh();
  }

  /**
   * Runs a sample through the Goertzel algorithm, updating the energies for each frequency.
   * @param {number} sample
   * @example
   * const g = new Goertzel(frequencies = [697, 770, 852, 941]);
   * g.processSample(42);
   * g.processSample(84);
   * g.energies;
   * // { '697': 0.8980292970055112,
   * //   '770': 0.8975953139667142,
   * //   '852': 0.8970565383230514,
   * //   '941': 0.8964104403348228 }
   */
  processSample(sample) {
    this.frequencies.forEach(frequency => {
      this._getEnergyOfFrequency(sample, frequency);
    });
  }

  /**
   * Re-initializes the state by zeroing-out all values. You will need to do this for every window you wish to analyze.
   */
  refresh() {
    GOERTZEL_ATTRIBUTES.forEach(attribute => {
      this.frequencies.forEach(frequency => {
        this[attribute][frequency] = 0;
      });
    });
  }

  // private

  _getEnergyOfFrequency(sample, frequency) {
    let f1 = this.firstPrevious[frequency];
    let f2 = this.secondPrevious[frequency];
    const coefficient = this.coefficient[frequency];
    const sine = sample + (coefficient * f1) - f2;
    f2 = f1;
    f1 = sine;
    this.filterLength[frequency] += 1;
    const power = (f2 * f2) + (f1 * f1) - (coefficient * f1 * f2);
    const totalPower = this.totalPower[frequency] += sample * sample;
    if (totalPower === 0) this.totalPower[frequency] = 1;
    this.energies[frequency] = power / totalPower / this.filterLength[frequency];
    this.firstPrevious[frequency] = f1;
    this.secondPrevious[frequency] = f2;
  }

  _initialize() {
    GOERTZEL_ATTRIBUTES.forEach(attribute => {
      this[attribute] = {};
    });
    this.coefficient = {};
    this.frequencies.forEach(frequency => {
      let normalizedFrequency = frequency / this.sampleRate;
      let omega = 2 * Math.PI * normalizedFrequency;
      let cosine = Math.cos(omega);
      this.coefficient[frequency] = 2 * cosine;
    });
  }
}
