import { cleanup, render, screen } from "@testing-library/react"
import { a11y, act, fireEvent, renderHook } from "@yamada-ui/test"
import { RangeSlider, RangeSliderEndThumb, RangeSliderStartThumb } from "../src"
import { useRangeSlider } from "../src/range-slider"

describe("<RangeSlider />", () => {
  test("should render correctly", async () => {
    const { container } = render(<RangeSlider />)
    await a11y(container)
  })

  test("should have correct class", () => {
    render(<RangeSlider data-testid="slider" />)
    expect(screen.getByTestId("slider")).toHaveClass("ui-slider")
  })

  test("should have correct default values", () => {
    const defaultValue: [number, number] = [0, 25]
    const { getByTestId } = render(
      <RangeSlider data-testid="slider" defaultValue={defaultValue} />,
    )

    const inputs = getByTestId("slider").getElementsByTagName("input")

    defaultValue.forEach((value, index) => {
      expect(inputs[index]).toHaveValue(String(value))
    })
  })

  test("RangeSlider thumbs should have correct aria-valuemin and aria-valuemax", () => {
    const { min, max } = { min: 0, max: 100 }
    render(<RangeSlider min={min} max={max} />)

    const sliderThumbs = screen.getAllByRole("slider")

    sliderThumbs.forEach((sliderThumb) => {
      expect(sliderThumb).toHaveAttribute("aria-valuemin", String(min))
      expect(sliderThumb).toHaveAttribute("aria-valuemax", String(max))
    })
  })

  test("RangeSlider thumbs should have correct aria-valuenow", () => {
    const defaultValue: [number, number] = [10, 50]
    render(<RangeSlider defaultValue={defaultValue} />)

    const sliderThumbs = screen.getAllByRole("slider")

    sliderThumbs.forEach((sliderThumb, index) => {
      expect(sliderThumb).toHaveAttribute(
        "aria-valuenow",
        String(defaultValue[index]),
      )
    })
  })

  test("can change RangeSlider orientation", () => {
    const { container } = render(
      <RangeSlider orientation="vertical" data-testid="slider" />,
    )

    let sliderThumbs = container.querySelectorAll(".ui-slider__thumb")
    let filledTrack = container.querySelector(".ui-slider__track")

    sliderThumbs.forEach((sliderThumb) => {
      expect(sliderThumb).toHaveAttribute("aria-orientation", "vertical")
    })
    expect(filledTrack).toHaveStyle("height: 100%")

    cleanup()

    const { container: horizontalContainer } = render(
      <RangeSlider orientation="horizontal" data-testid="slider" />,
    )

    sliderThumbs = horizontalContainer.querySelectorAll(".ui-slider__thumb")
    filledTrack = horizontalContainer.querySelector(".ui-slider__track")

    sliderThumbs.forEach((sliderThumb) => {
      expect(sliderThumb).toHaveAttribute("aria-orientation", "horizontal")
    })
    expect(filledTrack).toHaveStyle("width: 100%")
  })

  test("can be reversed", () => {
    const { min, max } = { min: 0, max: 100 }
    const { container } = render(
      <RangeSlider isReversed min={min} max={max} defaultValue={[min, max]} />,
    )
    const sliderThumbs = container.querySelectorAll(".ui-slider__thumb")
    const filledTrack = container.querySelector(".ui-slider__track-filled")

    expect(sliderThumbs[0].id).toContain("-0")
    expect(sliderThumbs[1].id).toContain("-1")

    expect(filledTrack).toHaveStyle("right: 0%")
  })

  test("can be disabled", () => {
    const { container } = render(<RangeSlider isDisabled />)
    const sliderInputs = container.getElementsByTagName("input")
    const sliderThumbs = container.querySelectorAll(".ui-slider__thumb")

    Array.from(sliderInputs).forEach((input) => {
      expect(input).toBeDisabled()
      expect(input).toHaveAttribute("aria-disabled", "true")
    })

    sliderThumbs.forEach((sliderThumb) => {
      expect(sliderThumb).toHaveAttribute("aria-disabled", "true")
    })
  })

  test("can be readOnly", () => {
    render(<RangeSlider data-testid="slider" isReadOnly />)

    const slider = screen.getByTestId("slider")
    const sliderInputs = slider.getElementsByTagName("input")
    const sliderThumbs = slider.querySelectorAll('[role="slider"]')

    Array.from(sliderInputs).forEach((sliderInput) => {
      expect(sliderInput).toHaveAttribute("aria-readonly", "true")
      expect(sliderInput).toHaveAttribute("readonly", "")
    })

    Array.from(sliderThumbs).forEach((sliderThumb) => {
      expect(sliderThumb).toHaveAttribute("aria-readonly", "true")
    })
  })

  test("should throw error when max is less than min", () => {
    const min = 10
    const max = 5

    const renderWithInvalidProps = () =>
      render(<RangeSlider min={min} max={max} />)

    const consoleSpy = vi.spyOn(console, "error")
    consoleSpy.mockImplementation(() => {})

    expect(renderWithInvalidProps).toThrow(
      "Do not assign a number less than 'min' to 'max'",
    )

    consoleSpy.mockRestore()
  })

  test("should set isReadOnly to true when focusThumbOnChange is false", () => {
    render(<RangeSlider data-testid="slider" focusThumbOnChange={false} />)

    const slider = screen.getByTestId("slider")
    const sliderInputs = slider.getElementsByTagName("input")

    Array.from(sliderInputs).forEach((sliderInput) => {
      expect(sliderInput).toHaveAttribute("aria-readonly", "true")
      expect(sliderInput).toHaveAttribute("readonly", "")
    })

    const sliderThumbs = slider.querySelectorAll('[role="slider"]')

    Array.from(sliderThumbs).forEach((sliderThumb) => {
      expect(sliderThumb).toHaveAttribute("aria-readonly", "true")
    })
  })

  test("key down should perform correct actions", async () => {
    const min = 0
    const max = 100
    const tenStep = (max - min) / 10
    const { container } = render(
      <RangeSlider
        data-testid="slider"
        min={min}
        max={max}
        step={10}
        defaultValue={[0, 50]}
      />,
    )

    const sliderThumbs = screen.getAllByRole("slider")
    const sliderInputs = container.getElementsByTagName("input")

    let sliderThumb = sliderThumbs[1]

    await act(() => fireEvent.focus(sliderThumb))
    await act(() => fireEvent.keyDown(sliderThumb, { key: "ArrowRight" }))
    expect(Number(sliderInputs[1].value)).toBe(60)
    await act(() => fireEvent.keyDown(sliderThumb, { key: "ArrowLeft" }))
    expect(Number(sliderInputs[1].value)).toBe(50)

    await act(() => fireEvent.keyDown(sliderThumb, { key: "ArrowUp" }))
    expect(Number(sliderInputs[1].value)).toBe(60)
    await act(() => fireEvent.keyDown(sliderThumb, { key: "ArrowDown" }))
    expect(Number(sliderInputs[1].value)).toBe(50)

    await act(() => fireEvent.keyDown(sliderThumb, { key: "PageUp" }))
    expect(Number(sliderInputs[1].value)).toBe(50 + tenStep)
    await act(() => fireEvent.keyDown(sliderThumb, { key: "PageDown" }))
    expect(Number(sliderInputs[1].value)).toBe(50)

    await act(() => fireEvent.keyDown(sliderThumb, { key: "Home" }))
    expect(Number(sliderInputs[1].value)).toBe(Number(sliderInputs[0].value))
    await act(() => fireEvent.keyDown(sliderThumb, { key: "End" }))
    expect(Number(sliderInputs[1].value)).toBe(max)

    sliderThumb = sliderThumbs[0]

    await act(() => fireEvent.focus(sliderThumb))
    await act(() => fireEvent.keyDown(sliderThumb, { key: "ArrowRight" }))
    expect(Number(sliderInputs[0].value)).toBe(10)
    await act(() => fireEvent.keyDown(sliderThumb, { key: "ArrowLeft" }))
    expect(Number(sliderInputs[0].value)).toBe(0)

    await act(() => fireEvent.keyDown(sliderThumb, { key: "ArrowUp" }))
    expect(Number(sliderInputs[0].value)).toBe(10)
    await act(() => fireEvent.keyDown(sliderThumb, { key: "ArrowDown" }))
    expect(Number(sliderInputs[0].value)).toBe(0)

    await act(() => fireEvent.keyDown(sliderThumb, { key: "PageUp" }))
    expect(Number(sliderInputs[0].value)).toBe(0 + tenStep)
    await act(() => fireEvent.keyDown(sliderThumb, { key: "PageDown" }))
    expect(Number(sliderInputs[0].value)).toBe(0)

    await act(() => fireEvent.keyDown(sliderThumb, { key: "Home" }))
    expect(Number(sliderInputs[0].value)).toBe(min)
    await act(() => fireEvent.keyDown(sliderThumb, { key: "End" }))
    expect(Number(sliderInputs[0].value)).toBe(Number(sliderInputs[1].value))
  })

  test("key down for keys not in the list should do nothing", async () => {
    const min = 0
    const max = 100
    const { container } = render(
      <RangeSlider min={min} max={max} step={10} defaultValue={[0, 50]} />,
    )

    const sliderThumb = screen.getAllByRole("slider")[0]
    const sliderInput = container.getElementsByTagName("input")[0]

    await act(() => fireEvent.focus(sliderThumb))
    await act(() => fireEvent.keyDown(sliderThumb, { key: "Enter" }))
    expect(Number(sliderInput.value)).toBe(0)
  })

  test("should allow custom thumb for RangeSlider", () => {
    const { container } = render(
      <>
        <RangeSlider
          thumbProps={{
            children: "test",
          }}
        />
        <RangeSlider>
          <RangeSliderStartThumb>test</RangeSliderStartThumb>
          <RangeSliderEndThumb>test</RangeSliderEndThumb>
        </RangeSlider>
      </>,
    )

    const rangeSliderThumbs = container.querySelectorAll(
      ".ui-range-slider__thumb",
    )

    rangeSliderThumbs.forEach((rangeSliderThumb) => {
      expect(rangeSliderThumb.textContent).toBe("test")
    })
  })

  test("should use RangeSlider with props", () => {
    const onChangeStart = vi.fn()
    const onChangeEnd = vi.fn()
    const onChange = vi.fn()

    const { result } = renderHook(() =>
      useRangeSlider({
        id: "test-slider",
        name: "test-slider",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: [25, 75],
        orientation: "horizontal",
        isReversed: false,
        focusThumbOnChange: true,
        onChangeStart,
        onChangeEnd,
        onChange,
      }),
    )

    expect(result.current.values).toEqual([25, 75])

    act(() => {
      result.current.stepUp(1)
    })
    expect(result.current.values).toEqual([25, 76])
    expect(onChange).toHaveBeenCalledWith([25, 76])

    act(() => {
      result.current.stepDown(1)
    })
    expect(result.current.values).toEqual([25, 75])
    expect(onChange).toHaveBeenCalledWith([25, 75])

    act(() => {
      result.current.reset()
    })
    expect(result.current.values).toEqual([25, 75])
    expect(onChange).toHaveBeenCalledWith([25, 75])
  })

  test("RangeSlider component with pointer events", () => {
    const onChangeStart = vi.fn()
    const onChangeEnd = vi.fn()
    const onChange = vi.fn()

    const { getAllByRole } = render(
      <RangeSlider
        id="test-slider"
        name="test"
        min={0}
        max={100}
        step={1}
        defaultValue={[25, 75]}
        orientation="horizontal"
        isReversed={false}
        onChangeStart={onChangeStart}
        onChangeEnd={onChangeEnd}
        onChange={onChange}
      />,
    )

    const sliderStartThumb = getAllByRole("slider")[0]
    const sliderEndThumb = getAllByRole("slider")[1]

    act(() => {
      fireEvent.focus(sliderStartThumb)
      fireEvent.pointerDown(sliderStartThumb)
      fireEvent.pointerUp(sliderStartThumb)
    })

    expect(onChangeStart).toHaveBeenCalledWith([25, 75])
    expect(onChange).toHaveBeenCalled()
    expect(onChangeEnd).toHaveBeenCalled()

    act(() => {
      fireEvent.focus(sliderEndThumb)
      fireEvent.pointerDown(sliderEndThumb)
      fireEvent.pointerUp(sliderEndThumb)
    })

    expect(onChangeStart).toHaveBeenCalledWith([25, 75])
    expect(onChange).toHaveBeenCalled()
    expect(onChangeEnd).toHaveBeenCalled()
  })
})
