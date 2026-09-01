/* Mezcal payload validator and builder.
   Runs entirely in the page. Nothing typed here is stored, logged, or sent
   anywhere: there is no fetch, no XHR, no beacon, and no storage write.

   Rules implemented: the specification page of this site, which follows
   bitapeslabs/mezcal at revision 0f3323ff. Bitcoin mainnet. */
(function () {
  "use strict";

  var P_VALUES = ["mezcal", "https://mezcal.sh", "https://t.me/mezcalbtc"];
  var TOP_KEYS = ["p", "edicts", "etching", "mint", "pointer"];
  var ETCH_KEYS = ["mezcal", "symbol", "divisibility", "premine", "terms", "turbo"];
  var TERM_KEYS = ["amount", "cap", "height", "offset", "price"];
  var MAX_U128 = (1n << 128n) - 1n;
  var MAX_U32 = 4294967295;
  var MAX_SATS = 2100000000000000;
  var ID_RE = /^\d+:\d+$/;
  var NAME_RE = /^[a-z0-9-]+$/;

  var encoder = new TextEncoder();
  var decoder = new TextDecoder("utf-8", { fatal: true });

  /* ---------- helpers ---------- */

  function bytesOf(text) {
    return encoder.encode(text);
  }

  function hexOf(bytes) {
    var out = "";
    for (var i = 0; i < bytes.length; i++) {
      out += bytes[i].toString(16).padStart(2, "0");
    }
    return out;
  }

  function fromHex(hex) {
    var clean = hex.replace(/\s+/g, "");
    if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) return null;
    var out = new Uint8Array(clean.length / 2);
    for (var i = 0; i < out.length; i++) {
      out[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return out;
  }

  /* Pull the pushed payload out of a whole OP_RETURN scriptPubKey. */
  function payloadFromScript(bytes) {
    if (!bytes.length || bytes[0] !== 0x6a) return null;
    var chunks = [];
    var at = 1;
    while (at < bytes.length) {
      var op = bytes[at];
      var len = 0;
      if (op >= 0x01 && op <= 0x4b) {
        len = op;
        at += 1;
      } else if (op === 0x4c) {
        len = bytes[at + 1];
        at += 2;
      } else if (op === 0x4d) {
        len = bytes[at + 1] | (bytes[at + 2] << 8);
        at += 3;
      } else {
        at += 1;
        continue;
      }
      if (at + len > bytes.length) return null;
      chunks.push(bytes.slice(at, at + len));
      at += len;
    }
    if (!chunks.length) return null;
    var total = chunks.reduce(function (sum, chunk) {
      return sum + chunk.length;
    }, 0);
    var joined = new Uint8Array(total);
    var offset = 0;
    chunks.forEach(function (chunk) {
      joined.set(chunk, offset);
      offset += chunk.length;
    });
    return joined;
  }

  function scriptHexFor(bytes) {
    var len = bytes.length;
    var prefix;
    if (len < 76) prefix = "6a" + len.toString(16).padStart(2, "0");
    else if (len < 256) prefix = "6a4c" + len.toString(16).padStart(2, "0");
    else
      prefix =
        "6a4d" +
        (len & 0xff).toString(16).padStart(2, "0") +
        ((len >> 8) & 0xff).toString(16).padStart(2, "0");
    return prefix + hexOf(bytes);
  }

  function scriptLength(payloadLength) {
    if (payloadLength < 76) return payloadLength + 2;
    if (payloadLength < 256) return payloadLength + 3;
    return payloadLength + 4;
  }

  function isU128String(value) {
    if (typeof value !== "string" || value === "" || !/^\d+$/.test(value)) return false;
    try {
      var n = BigInt(value);
      return n >= 0n && n <= MAX_U128;
    } catch (err) {
      return false;
    }
  }

  function isInt(value, min, max) {
    return (
      typeof value === "number" &&
      Number.isInteger(value) &&
      value >= min &&
      value <= max
    );
  }

  function codePoints(text) {
    return Array.from(String(text)).length;
  }

  function addressShape(value) {
    if (typeof value !== "string" || !value.trim()) return "missing";
    var address = value.trim();
    if (/^bc1[02-9ac-hj-np-z]{6,}$/.test(address) && address.length <= 90) return "ok";
    if (/^[13][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address)) return "ok";
    return "bad";
  }

  /* ---------- validation ---------- */

  function validate(payloadText, context) {
    var checks = [];
    var fatal = false;
    var ignored = false;

    function ok(label, detail) {
      checks.push({ state: "ok", label: label, detail: detail || "" });
    }
    function bad(label, detail) {
      checks.push({ state: "bad", label: label, detail: detail || "" });
      fatal = true;
    }
    /* Valid to the decoder, but the operation would be discarded by the
       indexer. This is not a cenotaph and burns nothing. */
    function warn(label, detail) {
      checks.push({ state: "warn", label: label, detail: detail || "" });
      ignored = true;
    }
    function info(label, detail) {
      checks.push({ state: "info", label: label, detail: detail || "" });
    }

    var value;
    try {
      value = JSON.parse(payloadText);
    } catch (err) {
      bad("C-6 the payload parses as JSON", "It does not. A cenotaph burns every Mezcal balance on the inputs.");
      return { checks: checks, fatal: true };
    }
    ok("C-6 the payload parses as JSON");

    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      bad("P-1 the payload is a JSON object", "The top level is " + (Array.isArray(value) ? "an array" : typeof value) + ".");
      return { checks: checks, fatal: true };
    }
    ok("P-1 the payload is a JSON object");

    var unknown = Object.keys(value).filter(function (key) {
      return TOP_KEYS.indexOf(key) === -1;
    });
    if (unknown.length) bad("P-2 only known top-level keys", "Unknown: " + unknown.join(", "));
    else ok("P-2 only known top-level keys");

    if (P_VALUES.indexOf(value.p) === -1) {
      bad(
        "P-3 the protocol tag is one of the three literals",
        value.p === undefined ? "p is missing." : "Found " + JSON.stringify(value.p) + "."
      );
    } else {
      ok("P-3 the protocol tag is one of the three literals", JSON.stringify(value.p));
    }

    var operations = [];

    /* edicts */
    if ("edicts" in value) {
      if (!Array.isArray(value.edicts)) {
        bad("P-4 edicts is an array", "Found " + typeof value.edicts + ".");
      } else {
        ok("P-4 edicts is an array", value.edicts.length + " edict(s)");
        value.edicts.forEach(function (raw, index) {
          var tag = "edict " + index;
          var id;
          var amount;
          var output;
          if (Array.isArray(raw)) {
            if (raw.length !== 3) {
              bad("P-4 " + tag + " has three elements", "Found " + raw.length + ".");
              return;
            }
            id = raw[0];
            amount = raw[1];
            output = raw[2];
          } else if (raw && typeof raw === "object") {
            var keys = Object.keys(raw).sort().join(",");
            if (keys !== "amount,id,output") {
              bad("P-4 " + tag + " object has id, amount and output", "Found " + keys + ".");
              return;
            }
            id = raw.id;
            amount = raw.amount;
            output = raw.output;
          } else {
            bad("P-4 " + tag + " is a tuple or an object", "Found " + typeof raw + ".");
            return;
          }

          if (typeof id !== "string" || !ID_RE.test(id)) {
            bad("I-1 " + tag + " id looks like block:tx", "Found " + JSON.stringify(id) + ".");
          } else {
            var parts = id.split(":");
            if (Number(parts[0]) === 0 && Number(parts[1]) !== 0) {
              bad("I-5 " + tag + " block-zero id is only 0:0", "Found " + id + ".");
            } else {
              ok("I-1 " + tag + " id " + id, Number(parts[0]) === 0 ? "self-reference to the asset etched here" : "");
            }
          }

          if (!isU128String(amount)) {
            bad(
              "U-1 " + tag + " amount is a u128 decimal string",
              typeof amount === "number" ? "It is a JSON number." : "Found " + JSON.stringify(amount) + "."
            );
          } else if (amount === "0") {
            ok("U-1 " + tag + " amount is a u128 decimal string", 'A-5: "0" allocates the whole remaining pool.');
          } else {
            ok("U-1 " + tag + " amount is a u128 decimal string", amount + " base units");
          }

          if (!isInt(output, 0, 255)) {
            bad("A-1 " + tag + " output is an integer 0 to 255", "Found " + JSON.stringify(output) + ".");
          } else if (context.outputs && output > context.outputs - 1) {
            bad(
              "A-1 " + tag + " output is a real output index",
              "Index " + output + " with " + context.outputs + " outputs. The last index is " + (context.outputs - 1) + ", so this is a cenotaph (X-7)."
            );
          } else if (context.opReturnIndex !== null && output === context.opReturnIndex) {
            info("A-8 " + tag + " targets the OP_RETURN output", "These units are burnt on purpose (B-1).");
          } else {
            ok("A-1 " + tag + " output index " + output);
          }
        });
        if (value.edicts.length) operations.push("transfer");
      }
    }

    /* mint */
    if ("mint" in value) {
      if (typeof value.mint !== "string" || !ID_RE.test(value.mint)) {
        bad("I-2 mint is a block:tx string", "Found " + JSON.stringify(value.mint) + ".");
      } else {
        var mintParts = value.mint.split(":").map(Number);
        if (mintParts[0] > MAX_U32 || mintParts[1] > MAX_U32) {
          bad("I-2 mint parts fit in u32", value.mint);
        } else {
          ok("I-2 mint " + value.mint);
          operations.push("mint");
        }
      }
    }

    /* pointer */
    if ("pointer" in value) {
      if (!isInt(value.pointer, 0, MAX_U32)) {
        bad("P-5 pointer is an integer 0 to 4294967295", "Found " + JSON.stringify(value.pointer) + ".");
      } else if (value.pointer === 0) {
        info("R-3 pointer 0 is treated as absent", "The remainder goes to the first non-OP_RETURN output.");
      } else if (context.outputs && value.pointer > context.outputs - 1) {
        info(
          "R-2 pointer is not an index of this transaction",
          "It falls back to the first non-OP_RETURN output. This is not a cenotaph."
        );
      } else {
        ok("P-5 pointer " + value.pointer);
      }
    }

    /* etching */
    if ("etching" in value) {
      var etch = value.etching;
      if (!etch || typeof etch !== "object" || Array.isArray(etch)) {
        bad("P-5 etching is an object", "Found " + typeof etch + ".");
      } else {
        var etchUnknown = Object.keys(etch).filter(function (key) {
          return ETCH_KEYS.indexOf(key) === -1;
        });
        if (etchUnknown.length) bad("E-1 only known etching keys", "Unknown: " + etchUnknown.join(", "));
        else ok("E-1 only known etching keys");

        ["mezcal", "symbol", "divisibility", "premine", "terms"].forEach(function (key) {
          if (!(key in etch)) bad("E-1 etching." + key + " is present", "It is missing.");
        });

        if (typeof etch.mezcal !== "string" || !NAME_RE.test(etch.mezcal) || etch.mezcal.length < 1 || etch.mezcal.length > 15) {
          bad("E-2 name is 1 to 15 lowercase letters, digits or hyphens", "Found " + JSON.stringify(etch.mezcal) + ".");
        } else {
          ok("E-2 name " + etch.mezcal);
        }

        if (typeof etch.symbol !== "string" || codePoints(etch.symbol) !== 1) {
          bad("E-3 symbol is exactly one code point", "Found " + JSON.stringify(etch.symbol) + ".");
        } else {
          ok("E-3 symbol " + etch.symbol);
        }

        if (!isInt(etch.divisibility, 0, 18)) {
          bad("E-4 divisibility is an integer 0 to 18", "Found " + JSON.stringify(etch.divisibility) + ".");
        } else {
          ok("E-4 divisibility " + etch.divisibility);
        }

        if (!isU128String(etch.premine)) {
          bad("E-5 premine is a u128 decimal string", "Found " + JSON.stringify(etch.premine) + ".");
        } else {
          ok("E-5 premine " + etch.premine + " base units");
        }

        if ("turbo" in etch && typeof etch.turbo !== "boolean") {
          bad("E-1 turbo is a boolean", "Found " + JSON.stringify(etch.turbo) + ".");
        }

        if (etch.terms === null) {
          info("E-11 terms is null", "The asset can never be minted. Its whole supply is the premine.");
        } else if (!etch.terms || typeof etch.terms !== "object" || Array.isArray(etch.terms)) {
          bad("E-7 terms is an object or null", "Found " + typeof etch.terms + ".");
        } else {
          var terms = etch.terms;
          var termUnknown = Object.keys(terms).filter(function (key) {
            return TERM_KEYS.indexOf(key) === -1;
          });
          if (termUnknown.length) bad("E-7 only known terms keys", "Unknown: " + termUnknown.join(", "));

          if (!isU128String(terms.amount)) {
            bad("E-7 terms.amount is a u128 decimal string", "Found " + JSON.stringify(terms.amount) + ".");
          } else {
            ok("E-7 terms.amount " + terms.amount);
          }
          if ("cap" in terms && terms.cap !== null && !isU128String(terms.cap)) {
            bad("E-7 terms.cap is a u128 decimal string or null", "Found " + JSON.stringify(terms.cap) + ".");
          }
          ["height", "offset"].forEach(function (key) {
            var pair = terms[key];
            if (
              !Array.isArray(pair) ||
              pair.length !== 2 ||
              !pair.every(function (part) {
                return part === null || isInt(part, 0, MAX_U32);
              })
            ) {
              bad("E-7 terms." + key + " is a pair of u32 or null", "Found " + JSON.stringify(pair) + ".");
            } else {
              ok("E-7 terms." + key + " " + JSON.stringify(pair));
            }
          });

          var prices = null;
          if ("price" in terms && terms.price !== null && terms.price !== undefined) {
            prices = Array.isArray(terms.price) ? terms.price : [terms.price];
            prices.forEach(function (term, index) {
              if (!term || typeof term !== "object") {
                bad("E-8 price " + index + " is an object", "Found " + typeof term + ".");
                return;
              }
              var sats = typeof term.amount === "string" ? Number(term.amount) : term.amount;
              if (!isInt(sats, 0, MAX_SATS)) {
                bad("E-8 price " + index + " amount is satoshis", "Found " + JSON.stringify(term.amount) + ".");
              } else {
                ok("E-8 price " + index + " amount " + sats + " sats");
              }
              var shape = addressShape(term.pay_to);
              if (shape === "ok") {
                info("E-8 price " + index + " pay_to has a mainnet address shape", "A full checksum check happens in the indexer.");
              } else {
                bad("E-8 price " + index + " pay_to is a Bitcoin mainnet address", "Found " + JSON.stringify(term.pay_to) + ".");
              }
            });
          }

          var isFlex = terms.amount === "0" && prices && prices.length === 1;
          if (terms.amount === "0" && !isFlex) {
            warn("E-10 amount 0 needs exactly one price term", "Not a cenotaph, but the etching would be ignored entirely and nothing would be created.");
          }
          if (isFlex && "cap" in terms && terms.cap !== null && terms.cap !== "0") {
            warn("E-10 a flex mint cannot have a cap", "Not a cenotaph, but the etching would be ignored entirely and nothing would be created.");
          }
          if (isFlex) {
            info("E-9 flex mint", "Each mint produces floor(satoshis paid / price).");
          }
        }
        operations.push("etch");
      }
    }

    if (!operations.length) {
      info("P-6 no operation in this payload", "Valid. Balances on the inputs sweep by the remainder rule.");
    }

    /* remainder preview */
    if (context.outputs) {
      var opIndex = context.opReturnIndex;
      var first = 0;
      while (first === opIndex) first += 1;
      var destination;
      if (isInt(value.pointer, 1, MAX_U32) && value.pointer <= context.outputs - 1) {
        destination = value.pointer;
      } else {
        destination = first <= context.outputs - 1 ? first : opIndex;
      }
      if (destination === opIndex) {
        info("R-4 the remainder is burnt", "Everything unallocated lands on the OP_RETURN output.");
      } else {
        info("R-1 the remainder goes to output " + destination, "Everything the edicts did not allocate lands there.");
      }
    }

    return { checks: checks, fatal: fatal, ignored: ignored, operations: operations };
  }

  /* ---------- rendering ---------- */

  var input = document.getElementById("payload-input");
  var outputsField = document.getElementById("payload-outputs");
  var opReturnField = document.getElementById("payload-opreturn");
  var report = document.getElementById("payload-report");
  var inspectForm = document.getElementById("inspect-form");

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderChecks(result, extra) {
    var html = "";
    html +=
      '<p class="verdict ' +
      (result.fatal ? "bad" : result.ignored ? "warn" : "ok") +
      '">' +
      (result.fatal
        ? "Cenotaph. A transaction carrying this payload would burn every Mezcal balance on its inputs."
        : result.ignored
          ? "Valid payload, but an operation in it would be discarded. Nothing is burnt; the operation simply has no effect."
          : "Valid payload. It parses and every field is within range.") +
      "</p>";
    if (extra) html += '<p class="out">' + extra + "</p>";
    html += '<ul class="checks">';
    result.checks.forEach(function (check) {
      var mark =
        check.state === "ok"
          ? "&#10003;"
          : check.state === "bad"
            ? "&#10007;"
            : check.state === "warn"
              ? "!"
              : "&#8226;";
      html +=
        '<li class="' +
        check.state +
        '"><span class="mark" aria-hidden="true">' +
        mark +
        '</span><span><b>' +
        escapeHtml(check.label) +
        "</b>" +
        (check.detail ? "<span>" + escapeHtml(check.detail) + "</span>" : "") +
        "</span></li>";
    });
    html += "</ul>";
    report.innerHTML = html;
  }

  function inspect() {
    var raw = input.value.trim();
    if (!raw) {
      report.innerHTML = '<p class="out">Paste a payload above. Hex, a whole OP_RETURN script, or the JSON itself.</p>';
      return;
    }
    var text = raw;
    var notes = [];
    var bytes = null;

    var looksHex = /^[0-9a-fA-F\s]+$/.test(raw) && raw.replace(/\s+/g, "").length % 2 === 0;
    if (looksHex) {
      bytes = fromHex(raw);
      if (bytes && bytes[0] === 0x6a) {
        var pulled = payloadFromScript(bytes);
        if (!pulled) {
          report.innerHTML =
            '<p class="verdict bad">Cenotaph. The script starts with OP_RETURN but carries no readable push data (C-3).</p>';
          return;
        }
        notes.push("Read as a whole OP_RETURN script; the pushed payload was extracted.");
        bytes = pulled;
      } else if (bytes) {
        notes.push("Read as hex payload bytes.");
      }
      if (bytes) {
        try {
          text = decoder.decode(bytes);
        } catch (err) {
          report.innerHTML =
            '<p class="verdict bad">Cenotaph. The payload bytes are not valid UTF-8, so they cannot parse as JSON (C-6).</p>';
          return;
        }
      }
    }
    if (!bytes) {
      bytes = bytesOf(text);
      notes.push("Read as JSON text.");
    }

    var context = {
      outputs: Number(outputsField.value) > 0 ? Math.floor(Number(outputsField.value)) : 0,
      opReturnIndex: opReturnField.value === "" ? null : Math.floor(Number(opReturnField.value))
    };
    if (context.opReturnIndex !== null && !(context.opReturnIndex >= 0)) context.opReturnIndex = null;

    notes.push("Payload " + bytes.length + " bytes, output script " + scriptLength(bytes.length) + " bytes.");
    var result = validate(text, context);
    renderChecks(result, escapeHtml(notes.join(" ")));
  }

  if (inspectForm) {
    inspectForm.addEventListener("submit", function (event) {
      event.preventDefault();
      inspect();
    });
    [input, outputsField, opReturnField].forEach(function (field) {
      field.addEventListener("input", inspect);
    });
  }

  /* ---------- builder ---------- */

  var buildForm = document.getElementById("build-form");
  var buildOut = document.getElementById("build-report");

  function build() {
    var tag = document.getElementById("build-p").value;
    var id = document.getElementById("build-id").value.trim();
    var amount = document.getElementById("build-amount").value.trim();
    var decimals = document.getElementById("build-decimals").value;
    var scale = document.getElementById("build-scale").value;
    var output = document.getElementById("build-output").value;
    var pointer = document.getElementById("build-pointer").value.trim();
    var feeRate = Number(document.getElementById("build-feerate").value);
    var problems = [];

    if (!ID_RE.test(id)) problems.push("The asset id must look like block:tx, for example 899284:20.");
    var places = Number(decimals);
    if (!isInt(places, 0, 18)) problems.push("Divisibility must be an integer from 0 to 18.");

    var baseUnits = null;
    if (scale === "base") {
      if (!isU128String(amount)) problems.push("Base units must be a whole number within the u128 range.");
      else baseUnits = amount;
    } else if (!/^\d+(\.\d+)?$/.test(amount)) {
      problems.push("The display amount must be a decimal number, for example 77 or 1.25.");
    } else {
      var pieces = amount.split(".");
      var fraction = pieces[1] || "";
      if (fraction.length > places) {
        problems.push("The display amount has " + fraction.length + " decimal places but the asset has " + places + ".");
      } else {
        baseUnits = (pieces[0] + fraction.padEnd(places, "0")).replace(/^0+(?=\d)/, "");
        if (!isU128String(baseUnits)) problems.push("The resulting base-unit amount is out of range.");
      }
    }

    var outIndex = Number(output);
    if (!isInt(outIndex, 0, 255)) problems.push("The output index must be an integer from 0 to 255.");

    var pointerValue = null;
    if (pointer !== "") {
      pointerValue = Number(pointer);
      if (!isInt(pointerValue, 0, MAX_U32)) problems.push("The pointer must be an integer from 0 to 4294967295.");
    }

    if (problems.length) {
      buildOut.innerHTML =
        '<p class="verdict bad">Not buildable yet.</p><ul class="checks">' +
        problems
          .map(function (line) {
            return '<li class="bad"><span class="mark" aria-hidden="true">&#10007;</span><span><b>' + escapeHtml(line) + "</b></span></li>";
          })
          .join("") +
        "</ul>";
      return;
    }

    var payload = { p: tag, edicts: [[id, baseUnits, outIndex]] };
    if (pointerValue !== null) payload.pointer = pointerValue;
    var json = JSON.stringify(payload);
    var bytes = bytesOf(json);
    var script = scriptHexFor(bytes);
    var outputBytes = 8 + (scriptLength(bytes.length) < 253 ? 1 : 3) + scriptLength(bytes.length);
    var fee = Number.isFinite(feeRate) && feeRate > 0 ? Math.ceil(outputBytes * feeRate) : null;

    var display = places > 0
      ? (function () {
          var padded = baseUnits.padStart(places + 1, "0");
          var whole = padded.slice(0, padded.length - places);
          var frac = padded.slice(padded.length - places).replace(/0+$/, "");
          return frac ? whole + "." + frac : whole;
        })()
      : baseUnits;

    buildOut.innerHTML =
      '<p class="verdict ok">Payload built. It is valid under the rules on this site.</p>' +
      '<h3>JSON</h3><pre><code>' + escapeHtml(json) + "</code></pre>" +
      '<h3>Payload hex</h3><p class="out">' + hexOf(bytes) + "</p>" +
      '<h3>Whole OP_RETURN script</h3><p class="out">' + script + "</p>" +
      '<ul class="checks">' +
      '<li class="info"><span class="mark" aria-hidden="true">&#8226;</span><span><b>' + baseUnits + " base units</b><span>" + display + " at " + places + " decimals</span></span></li>" +
      '<li class="info"><span class="mark" aria-hidden="true">&#8226;</span><span><b>' + bytes.length + " payload bytes, " + scriptLength(bytes.length) + " script bytes, " + outputBytes + " serialized output bytes</b></span></li>" +
      (fee === null
        ? ""
        : '<li class="info"><span class="mark" aria-hidden="true">&#8226;</span><span><b>' + fee + " sats for this output at " + feeRate + " sat/vB</b><span>The rest of the transaction is priced separately.</span></span></li>") +
      '<li class="info"><span class="mark" aria-hidden="true">&#8226;</span><span><b>Check the output index against the transaction you will actually sign</b><span>An index above the last output makes the whole transaction a cenotaph (X-7).</span></span></li>' +
      "</ul>";
  }

  if (buildForm) {
    buildForm.addEventListener("submit", function (event) {
      event.preventDefault();
      build();
    });
    Array.prototype.forEach.call(buildForm.querySelectorAll("input,select"), function (field) {
      field.addEventListener("input", build);
      field.addEventListener("change", build);
    });
    build();
  }

  /* ---------- mode switch ---------- */

  var modeButtons = document.querySelectorAll("[data-mode]");
  Array.prototype.forEach.call(modeButtons, function (button) {
    button.addEventListener("click", function () {
      var mode = button.getAttribute("data-mode");
      Array.prototype.forEach.call(modeButtons, function (other) {
        other.setAttribute("aria-pressed", String(other === button));
      });
      document.getElementById("panel-inspect").hidden = mode !== "inspect";
      document.getElementById("panel-build").hidden = mode !== "build";
      report.hidden = mode !== "inspect";
      buildOut.hidden = mode !== "build";
    });
  });

  /* ---------- samples ---------- */

  Array.prototype.forEach.call(document.querySelectorAll("[data-sample]"), function (button) {
    button.addEventListener("click", function () {
      input.value = button.getAttribute("data-sample");
      document.getElementById("panel-inspect").hidden = false;
      document.getElementById("panel-build").hidden = true;
      report.hidden = false;
      buildOut.hidden = true;
      Array.prototype.forEach.call(modeButtons, function (other) {
        other.setAttribute("aria-pressed", String(other.getAttribute("data-mode") === "inspect"));
      });
      inspect();
      report.scrollIntoView({ block: "nearest" });
    });
  });

  if (input) inspect();
})();
