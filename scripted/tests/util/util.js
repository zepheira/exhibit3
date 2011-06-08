module("Exhibit.Util");

test("round", function() {
    expect(7);

    strictEqual(Exhibit.Util.round(10000.4), '10000', "Exhibit.Util.round(10000.4) === '10000'");
    strictEqual(Exhibit.Util.round(10001, 5000), '10000', "Exhibit.Util.round(10001, 5000) === '10000'");
    strictEqual(Exhibit.Util.round(10001, 5000.0), '10000', "Exhibit.Util.round(10001, 5000.0) === '10000'");
    strictEqual(Exhibit.Util.round(10000, 0.1), '10000.0', "Exhibit.Util.round(10000, 0.1) === '10000.0'");
    strictEqual(Exhibit.Util.round(0.1, 1e-12), '0.100000000000', "Exhibit.Util.round(0.1, 1e-12) === '0.100000000000'");
    strictEqual(Exhibit.Util.round(66000, 1024), '65536', "Exhibit.Util.round(66000, 1024) === '65536'");
    strictEqual(Exhibit.Util.round(0, 0.1), '0.0', "Exhibit.Util.round(0, 0.1) === '0.0'");
});

test("Native string extensions", function() {
    equal("  Hello world".trim(),"Hello world","trim left two");
    equal("  Hello world ".trim(),"Hello world","trim both uneven");
    equal(" Hello world ".trim(),"Hello world","trim both even");
    equal("Hello world  ".trim(),"Hello world","trim right two");
    equal("Hello world".trim(),"Hello world","trim identity");
    equal("Hello    world".trim(),"Hello    world","trim identity centre gap");

    ok("Hello world".startsWith("H"),"startsWith char");
    ok("Hello world".startsWith("He"),"startsWith string");
    ok("Hello world".startsWith("Hello wor"),"startsWith long string");
    ok("Hello world".startsWith("Hello world"),"startsWith full string");
    ok(!" Hello world".startsWith("He"),"startsWith not string");
    ok(!"Hello world".startsWith("Hello world foobar"),"startsWith not overflow");

    ok("Hello world".endsWith("d"),"endsWith char");
    ok("Hello world".endsWith("ld"),"endsWith string");
    ok("Hello world".endsWith("llo world"),"endsWith long string");
    ok("Hello world".endsWith("Hello world"),"endsWith full string");
    ok(!"Hello world ".endsWith("ld"),"endsWith not string");
    ok(!"Hello world".endsWith("Hello world foobar"),"endsWith not overflow");

    var text = 'The %0 and the %1, the %3 jumped over the %2 \\%3%5.';
    var subs = ['cat', 'fiddle', 'moon', 'cow'];
    equal(String.substitute(text, subs),"The cat and the fiddle, the cow jumped over the moon %3%5.","substitute");
});
