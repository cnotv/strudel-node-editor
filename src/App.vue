<template>
  <RouterView />
</template>

<style>
body {
  background-color: var(--color-background);
}

canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  transition: top 0.2s;
}
</style>
