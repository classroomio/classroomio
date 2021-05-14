<script>
  export let checked = false;

  function onChange() {
    checked = !checked;
  }
</script>

<div class="neumorphism-toggle">
  <input type="checkbox" id="neumorphism" {checked} {onChange} />
  <label for="neumorphism">
    <div class="switch">
      <div class="dot" />
    </div>
    <span>Neumorphism</span>
  </label>
  <span>... not allowed to toggle again :(</span>
</div>

<style lang="scss">
  .neumorphism-toggle {
    position: relative;
    transition: transform 0.3s;
    transform: scale(var(--scale, 1)) translateZ(0);
    &:active {
      --scale: 0.96;
    }
    input {
      display: none;
      & + label {
        background: #fff;
        border-radius: 9px;
        padding: 16px 0 16px 20px;
        min-width: 208px;
        display: block;
        cursor: pointer;
        position: relative;
        box-shadow: -12px -12px 24px var(--light-shadow, transparent),
          12px 12px 24px var(--shadow, transparent);
        transition: box-shadow 0.4s;
        &:before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          border-radius: inherit;
          background: linear-gradient(160deg, #f1f4ff, #f9faff);
          opacity: var(--gradient, 0);
          transition: opacity 0.4s;
        }
        .switch {
          position: relative;
          display: inline-block;
          z-index: 1;
          vertical-align: top;
          height: 22px;
          width: 40px;
          border-radius: 11px;
          background: #eceffc;
          &:before {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            border-radius: inherit;
            background: linear-gradient(90deg, #4f97ff, #275efe);
            opacity: var(--gradient, 0);
            transition: opacity 0.4s;
          }
          .dot {
            background: #d1d6ee;
            position: absolute;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            left: -1px;
            top: -1px;
            transform: translateX(var(--offset, 0));
            transition: transform 0.4s, box-shadow 0.4s;
            box-shadow: -4px -4px 8px var(--light-shadow-2, transparent),
              4px 4px 8px var(--shadow, transparent);
            &:before {
              content: "";
              position: absolute;
              left: 0;
              top: 0;
              right: 0;
              bottom: 0;
              border-radius: inherit;
              background: linear-gradient(160deg, #f1f4ff, #f9faff);
              opacity: var(--gradient, 0);
              transition: opacity 0.4s;
            }
          }
        }
        span {
          line-height: 22px;
          font-size: 16px;
          color: var(--text, #646b8c);
          font-weight: 500;
          display: inline-block;
          vertical-align: top;
          z-index: 1;
          position: relative;
          margin-left: 12px;
          transition: color 0.4s;
        }
        & + span {
          text-align: center;
          display: block;
          position: absolute;
          left: 0;
          right: 0;
          top: 100%;
          opacity: 0;
          font-size: 12px;
          font-weight: 500;
          color: #a6accd;
          transform: translateY(4px);
          transition: opacity 0.4s, transform 0.4s;
        }
      }
      &:not(:checked) {
        & + label {
          pointer-events: none;
          & + span {
            opacity: 1;
            transform: translateY(12px);
          }
        }
      }
      &:checked {
        & + label {
          --offset: 18px;
          --text: #404660;
          --gradient: 1;
          --shadow: rgba(0, 6, 39, 0.1);
          --light-shadow: rgba(255, 255, 255, 0.8);
          --light-shadow-2: rgba(255, 255, 255, 0.1);
        }
      }
    }
  }

  html {
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
  }

  * {
    box-sizing: inherit;
    &:before,
    &:after {
      box-sizing: inherit;
    }
  }

  // dribbble & twitter
  body {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: "Inter", "Inter UI", Arial;
    background: #f6f8ff;
    .twitter {
      position: fixed;
      display: block;
      right: 16px;
      bottom: 16px;
      svg {
        width: 32px;
        height: 32px;
        fill: #1da1f2;
      }
    }
  }
</style>
