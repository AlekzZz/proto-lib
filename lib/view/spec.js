const View = require('./index');

describe('Lib View', () => {
  it('should be defined', () => {
    expect(View).to.not.be.undefined;
  });

  it('should throw an error if template doesn\'t exist', () => {
    let errorMessage;

    try {
      View('idontexist');
    } catch(e) {
      errorMessage = e.message;
    }

    expect(errorMessage).to.equal('View file "idontexist" not found.');
  });
});
